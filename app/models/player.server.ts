import * as A from "fp-ts/Array";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import hyperid from "hyperid";
import { z } from "zod";
import { runTasksArrayInParallel } from "~/utils/generic";
import { validateWithSchemaAsync } from "~/utils/validation";

export const Schema = z
  .object({
    id: z.coerce
      .string()
      .min(1, { message: "Player ID cannot be empty" })
      .brand<"PlayerID">(),
    name: z.coerce.string().min(1, { message: "Player name cannot be empty" }),
  })
  .strict();

export type Player = z.infer<typeof Schema>;

const generateId = () => hyperid({ urlSafe: true })() as Player["id"];

const STORAGE_PREFIX = "player#";

const createStorageKey = (id: Player["id"]) => {
  return `${STORAGE_PREFIX}${id}` as const;
};

/**
 * List all raw unvalidated players from storage
 */
const listRawPlayersFromStorage = TE.tryCatch(
  () => STORE.list({ prefix: STORAGE_PREFIX }),
  (error) => new Error(`Failed to list Players: ${error}`)
);

/**
 * Get a raw unvalidated player from storage
 */
const getRawPlayerFromStorage = (name: string) =>
  TE.tryCatch(
    () => STORE.get(name, "json"),
    (error) => new Error(`Failed to get Player ${name}: ${error}`)
  );

/**
 * Store a player
 */
const storePlayer = (player: Player) =>
  TE.tryCatch(
    async () => {
      await STORE.put(createStorageKey(player.id), JSON.stringify(player));
      return player;
    },
    (error) => new Error(`Failed to store Player: ${error}`)
  );

/**
 * Create a plain new player object with a new ID
 */
const createNewPlayer = (attributes: Omit<Player, "id">): Player => ({
  ...attributes,
  id: generateId(),
});

/**
 * Create a new player and store it
 */
export const put = (attributes: Omit<Player, "id">) =>
  pipe(
    createNewPlayer(attributes),
    validateWithSchemaAsync(Schema),
    TE.chainW(storePlayer)
  );

/**
 * Get a player by ID
 */
export const get = (id: Player["id"]) =>
  pipe(
    getRawPlayerFromStorage(createStorageKey(id)),
    validateWithSchemaAsync(Schema)
  );

/**
 * List all players, sorted by name
 */
export const list = () =>
  pipe(
    listRawPlayersFromStorage,
    TE.map((listResult) => listResult.keys),
    TE.map(A.map(({ name }) => getRawPlayerFromStorage(name))),
    TE.chainW(runTasksArrayInParallel),
    TE.chainW(validateWithSchemaAsync(z.array(Schema))),
    TE.map((players) => players.sort((a, b) => a.name.localeCompare(b.name)))
  );
