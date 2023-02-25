import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import hyperid from "hyperid";
import { z } from "zod";
import { eitherFromSafeParse } from "~/utils";
import {
  Schema as LeaderboardEntrySchema,
  type LeaderboardEntry,
} from "./leaderboard-entry";
import { type Player } from "./player";

export const Schema = z
  .object({
    id: z.string().brand<"GameID">(),
    name: z.string(),
    leaderboard: z.array(LeaderboardEntrySchema),
  })
  .strict();

export type Game = z.infer<typeof Schema>;

const generateId = () => hyperid({ urlSafe: true })() as Game["id"];

const STORAGE_PREFIX = "game#";
const createStorageKey = (id: Game["id"]) => `${STORAGE_PREFIX}${id}` as const;

export async function put(attributes: Omit<Game, "id">) {
  const game = Schema.safeParse({ ...attributes, id: generateId() });

  if (game.success === false) return E.left(game.error);

  try {
    // TODO: convert to TaskEither
    await STORE.put(createStorageKey(game.data.id), JSON.stringify(game.data));
    return E.right(game.data);
  } catch (error) {
    return E.left(new Error(`Failed to store Game: ${error}`));
  }
}

export async function updateLeaderboardEntry(
  gameId: Game["id"],
  playerId: Player["id"],
  attributes: Partial<LeaderboardEntry>
) {
  const maybeGame = await get(gameId);
  return pipe(
    maybeGame,
    E.map((game) => {
      const entry = game.leaderboard.find(
        ({ player }) => player.id === playerId
      );
      const newEntry = { ...entry, ...attributes };
      const safeEntry = LeaderboardEntrySchema.safeParse(newEntry);
      if (safeEntry.success === false) return E.left(safeEntry.error);
      // TODO: cleanup
      const newLeaderboard = game.leaderboard
        .map((entry) => {
          if (entry.player.id === playerId) return safeEntry.data;
          else return entry;
        })
        .sort((a, b) => {
          return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
        })
        .map((entry, index) => ({ ...entry, position: index + 1 }));
      return {
        ...game,
        leaderboard: newLeaderboard,
      };
    }),
    // TODO: this needs TaskEither
    E.map((updatedGame) =>
      STORE.put(createStorageKey(gameId), JSON.stringify(updatedGame))
    )
  );
}

export async function get(id: Game["id"]) {
  try {
    const storedGame = await STORE.get(createStorageKey(id), "json");
    return pipe(storedGame, Schema.safeParse, eitherFromSafeParse);
  } catch (error) {
    return E.left(new Error(`Failed to get Game: ${error}`));
  }
}

export async function getLeaderboardEntry(
  gameId: Game["id"],
  playerId: Player["id"]
) {
  // TODO: TaskEither
  const maybeGame = await get(gameId);
  return pipe(
    maybeGame,
    E.map((game) => game.leaderboard),
    E.map(A.findFirst(({ player }) => player.id === playerId))
  );
}

export async function list() {
  try {
    const { keys } = await STORE.list({ prefix: STORAGE_PREFIX });
    const storedGamesPromises = keys.map(({ name }) => {
      return STORE.get(name, "json");
    });
    const storedGames = await Promise.all(storedGamesPromises);
    const games = z.array(Schema).safeParse(storedGames);
    return eitherFromSafeParse(games);
  } catch (error) {
    return E.left(`Failed to list Games: ${error}`);
  }
}
