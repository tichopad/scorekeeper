import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/lib/function";
import hyperid from "hyperid";
import type { ZodError } from "zod";
import { z } from "zod";
import { eitherFromSafeParse } from "~/utils";
import { Schema as PlayerSchema, type Player } from "./player.server";

export const Schema = z
  .object({
    id: z.string().brand<"GameID">(),
    name: z.string(),
    leaderboard: z.array(
      z.object({
        position: z.number().positive().int(),
        player: PlayerSchema,
        score: z.coerce.number().int().default(0),
      })
    ),
  })
  .strict();

export type Game = z.infer<typeof Schema>;
type LeaderboardEntry = Game["leaderboard"][number];

const generateId = () => hyperid({ urlSafe: true })() as Game["id"];

const STORAGE_PREFIX = "game#";
const createStorageKey = (id: Game["id"]) => `${STORAGE_PREFIX}${id}` as const;

export async function put(
  attributes: Omit<Game, "id">
): Promise<E.Either<Error | ZodError<Game>, Game>> {
  const game = Schema.safeParse({ ...attributes, id: generateId() });

  if (game.success === false) return E.left(game.error);

  try {
    // TODO: convert to TaskEither1
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
      const safeEntry = Schema.shape.leaderboard.element.safeParse(newEntry);
      if (safeEntry.success === false) return E.left(safeEntry.error);
      // TODO: cleanup
      const newLeaderboard = game.leaderboard
        .map((entry) => {
          if (entry.player.id === playerId) return safeEntry.data;
          else return entry;
        })
        .sort((a, b) => {
          return a.score < b.score ? 1 : a.score > b.score ? -1 : 0;
        })
        .map((entry, index) => ({ ...entry, position: index + 1 }))
        .sort((a, b) => {
          return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
        });
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

export async function addPlayerToLeaderboard(
  id: Game["id"],
  player: Player,
  score: LeaderboardEntry["score"]
) {
  const maybeGame = await get(id);
  return pipe(
    maybeGame,
    E.map((game) => {
      // Calculate the position of the new entry
      const position = game.leaderboard.reduce((acc, entry) => {
        if (score > entry.score) return acc + 1;
        else return acc;
      }, 1);

      const newLeaderboard = [
        ...game.leaderboard,
        {
          position,
          player,
          score: score ?? 0,
        },
      ].sort((a, b) => {
        return a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
      });

      return {
        ...game,
        leaderboard: newLeaderboard,
      };
    }),
    E.map((updatedGame) => {
      return STORE.put(createStorageKey(id), JSON.stringify(updatedGame));
    })
  );
}

export async function get(
  id: Game["id"]
): Promise<E.Either<Error | ZodError<Game>, Game>> {
  try {
    // TODO: TaskEither
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
    E.chainW(
      flow(
        (game) => game.leaderboard,
        A.findFirst(({ player }) => player.id === playerId),
        E.fromOption(() => {
          return new Error(
            `Failed to find entry in a Game: ${gameId} for Player: ${playerId}`
          );
        })
      )
    )
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
    return E.left(new Error(`Failed to list Games: ${error}`));
  }
}
