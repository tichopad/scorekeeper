import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import hyperid from "hyperid";
import type { ZodError } from "zod";
import { z } from "zod";
import {
  validateWithSchema,
  validateWithSchemaAsync,
} from "~/utils/validation";
import { Schema as PlayerSchema, type Player } from "./player.server";

const LeaderboardEntrySchema = z.object({
  position: z.number().positive().int(),
  player: PlayerSchema,
  score: z.coerce.number().int().default(0),
});

export const Schema = z
  .object({
    id: z.coerce
      .string()
      .min(1, { message: "Game ID cannot be empty" })
      .brand<"GameID">(),
    name: z.coerce.string().min(1, { message: "Game name cannot be empty" }),
    leaderboard: z.array(LeaderboardEntrySchema),
  })
  .strict();

export type Game = z.infer<typeof Schema>;
type LeaderboardEntry = Game["leaderboard"][number];

const generateId = () => hyperid({ urlSafe: true })() as Game["id"];

const STORAGE_PREFIX = "game#";
const createStorageKey = (id: Game["id"]) => `${STORAGE_PREFIX}${id}` as const;

/**
 * List all raw unvalidated games from storage
 */
const listRawGamesFromStorage = TE.tryCatch(
  () => STORE.list({ prefix: STORAGE_PREFIX }),
  (error) => new Error(`Failed to list Games: ${error}`)
);

/**
 * Get a raw unvalidated game from storage
 */
const getRawGameFromStorage = (storageKey: string) =>
  TE.tryCatch(
    () => STORE.get(storageKey, "json"),
    (error) => new Error(`Failed to get Game ${name}: ${error}`)
  );

/**
 * Create a new Game and store it
 */
export function put(
  attributes: Omit<Game, "id">
): TE.TaskEither<Error | ZodError<Game>, Game> {
  const newGame: Game = { ...attributes, id: generateId() };
  const storeGame = TE.chainW((game: Game) => {
    return TE.tryCatch(
      async () => {
        await STORE.put(createStorageKey(game.id), JSON.stringify(game));
        return game;
      },
      (error) => new Error(`Failed to store Game: ${error}`)
    );
  });

  return pipe(newGame, validateWithSchemaAsync(Schema), storeGame);
}

/**
 * Add a Player to a Game's Leaderboard
 */
export function addPlayerToLeaderboard(
  gameId: Game["id"],
  player: Player,
  score: LeaderboardEntry["score"]
) {
  const getGame = get(gameId);

  const addPlayer = TE.map((game: Game) => {
    const newEntry: LeaderboardEntry = { position: 0, score, player };

    const sortedLeaderboard = game.leaderboard
      .concat([newEntry])
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, position: index + 1 }));

    return {
      ...game,
      leaderboard: sortedLeaderboard,
    };
  });

  return pipe(getGame, addPlayer, TE.chain(storeGame));
}

/**
 * Get a Game by ID
 */
export const get = (id: Game["id"]) =>
  pipe(
    getRawGameFromStorage(createStorageKey(id)),
    validateWithSchemaAsync(Schema)
  );

/**
 * Get a Leaderboard Entry for a Player in a Game
 */
const getEntryByPlayerId = (playerId: Player["id"]) => (game: Game) =>
  pipe(
    game.leaderboard,
    A.findFirst(({ player }) => player.id === playerId),
    E.fromOption(() => {
      return new Error(
        `Failed to find entry in a Game: ${game.id} for Player: ${playerId}`
      );
    })
  );

/**
 * Get a Leaderboard Entry for a Player in a Game
 */
export const getLeaderboardEntry = (
  gameId: Game["id"],
  playerId: Player["id"]
) =>
  pipe(
    get(gameId),
    TE.map(getEntryByPlayerId(playerId)),
    TE.map(TE.fromEither),
    TE.flatten
  );

/**
 * List all Games sorted by name
 */
export const list = () =>
  pipe(
    listRawGamesFromStorage,
    TE.chainW(({ keys }) =>
      pipe(
        keys,
        A.map(({ name }) => getRawGameFromStorage(name)),
        A.sequence(TE.ApplicativePar),
        validateWithSchemaAsync(z.array(Schema)),
        TE.map((games) => games.sort((a, b) => a.name.localeCompare(b.name)))
      )
    )
  );

/**
 * Update a Leaderboard Entry for a Player
 */
const updatePlayerEntry =
  (playerId: Player["id"], attributes: Partial<LeaderboardEntry>) =>
  (entry: LeaderboardEntry) => {
    if (entry.player.id !== playerId) return E.right(entry);
    return pipe(
      { ...entry, ...attributes },
      validateWithSchema(LeaderboardEntrySchema)
    );
  };

/**
 * Update the positions of a Leaderboard
 */
const updateLeaderboardPositionsByScore = (leaderboard: LeaderboardEntry[]) =>
  leaderboard
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, position: index + 1 }))
    .sort((a, b) => a.position - b.position);

/**
 * Update a Leaderboard
 */
const updateLeaderboard =
  (playerId: Player["id"], attributes: Partial<LeaderboardEntry>) =>
  (leaderboard: LeaderboardEntry[]) =>
    pipe(
      leaderboard,
      A.map(updatePlayerEntry(playerId, attributes)),
      A.sequence(E.Applicative),
      E.map(updateLeaderboardPositionsByScore)
    );

/**
 * Update a Game's Leaderboard
 */
const updateGameLeaderboard =
  (playerId: Player["id"], attributes: Partial<LeaderboardEntry>) =>
  (game: Game) =>
    pipe(
      game.leaderboard,
      updateLeaderboard(playerId, attributes),
      E.map((leaderboard) => ({ ...game, leaderboard })),
      TE.fromEither
    );

/**
 * Store a Game in the database
 */
const storeGame = (game: Game) =>
  TE.tryCatch(
    () => STORE.put(createStorageKey(game.id), JSON.stringify(game)),
    (error) => new Error(`Failed to save Game: ${error}`)
  );

/**
 * Update a LeaderboardEntry for a given Game and Player
 */
export const updateLeaderboardEntry = (
  gameId: Game["id"],
  playerId: Player["id"],
  attributes: Partial<LeaderboardEntry>
) =>
  pipe(
    get(gameId),
    TE.chainW(updateGameLeaderboard(playerId, attributes)),
    TE.chain(storeGame)
  );
