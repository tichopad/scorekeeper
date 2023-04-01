import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import hyperid from "hyperid";
import type { ZodError } from "zod";
import { z } from "zod";
import { eitherFromSafeParse } from "~/utils";

export const Schema = z
  .object({
    id: z.string().brand<"PlayerID">(),
    name: z.string(),
  })
  .strict();

export type Player = z.infer<typeof Schema>;

const generateId = () => hyperid({ urlSafe: true })() as Player["id"];

const STORAGE_PREFIX = "player#";
const createStorageKey = (id: Player["id"]) => {
  return `${STORAGE_PREFIX}${id}` as const;
};

export async function put(
  attributes: Omit<Player, "id">
): Promise<E.Either<Error | ZodError<Player>, Player>> {
  const player = Schema.safeParse({ ...attributes, id: generateId() });

  if (player.success === false) return E.left(player.error);

  try {
    // TODO: convert to TaskEither
    await STORE.put(
      createStorageKey(player.data.id),
      JSON.stringify(player.data)
    );
    return E.right(player.data);
  } catch (error) {
    return E.left(new Error(`Failed to store Player: ${error}`));
  }
}

export async function get(id: Player["id"]) {
  try {
    const storedPlayer = await STORE.get(createStorageKey(id), "json");
    return pipe(storedPlayer, Schema.safeParse, eitherFromSafeParse);
  } catch (error) {
    return E.left(new Error(`Failed to get Player: ${error}`));
  }
}

export async function list(): Promise<
  E.Either<Error | ZodError<Player>, Array<Player>>
> {
  try {
    const { keys } = await STORE.list({ prefix: STORAGE_PREFIX });
    const storedPlayersPromises = keys.map(({ name }) => {
      return STORE.get(name, "json");
    });
    const storedPlayers = await Promise.all(storedPlayersPromises);
    const players = z.array(Schema).safeParse(storedPlayers);
    return pipe(
      players,
      eitherFromSafeParse,
      E.map((players) => players.sort((a, b) => a.name.localeCompare(b.name)))
    );
  } catch (error) {
    return E.left(new Error(`Failed to list Players: ${error}`));
  }
}
