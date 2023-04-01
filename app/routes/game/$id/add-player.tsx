import { json, type ActionArgs, type LoaderArgs } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { list as listPlayers } from "~/models/player.server";
import { assert } from "~/utils";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const playerId = body.get("playerId");

  assert(playerId, "No player selected");
  assert(typeof playerId === "string", "Player ID has to be a string");

  // TODO: Add "addPlayerToAGame" or "updateGame" method
};

export const loader = async (args: LoaderArgs) => {
  const players = await listPlayers();

  return pipe(
    players,
    E.match(
      (error) => {
        console.error(error);
        throw new Response("Server error", { status: 500 });
      },
      (players) => json({ players })
    )
  );
};

export default function AddPlayer() {
  const { players } = useLoaderData<typeof loader>();

  return (
    <main>
      <h1>Add player</h1>
      <Form method="post">
        <select name="playerId">
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </Form>
    </main>
  );
}
