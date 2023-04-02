import {
  json,
  redirect,
  type ActionArgs,
  type LoaderArgs,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import type { Game } from "~/models/game.server";
import {
  Schema as GameSchema,
  addPlayerToLeaderboard,
  get as getGame,
} from "~/models/game.server";
import {
  Schema as PlayerSchema,
  get as getPlayer,
  list as listPlayers,
} from "~/models/player.server";

export const action = async ({ request, params }: ActionArgs) => {
  const gameId = params.id;

  // Validate game id
  const safeGameId = GameSchema.shape.id.safeParse(gameId);

  if (safeGameId.success === false) {
    throw new Response("Invalid game id", { status: 400 });
  }

  const body = await request.formData();
  const playerId = body.get("playerId");

  const safePlayerId = PlayerSchema.shape.id.safeParse(playerId);

  if (safePlayerId.success === false) {
    throw new Response("Invalid player id", { status: 400 });
  }

  const LeaderboardEntrySchema = GameSchema.shape.leaderboard.element;
  const initialScore = body.get("initialScore");
  const safeInitialScore =
    LeaderboardEntrySchema.shape.score.safeParse(initialScore);
  if (safeInitialScore.success === false) {
    throw new Response("Invalid initial score", { status: 400 });
  }

  // Get player by id
  const player = await getPlayer(safePlayerId.data);

  if (E.isLeft(player)) {
    throw new Response("Player not found", { status: 404 });
  }

  // Add player to leaderboard
  const result = await addPlayerToLeaderboard(
    safeGameId.data,
    player.right,
    safeInitialScore.data
  );

  return pipe(
    result,
    E.match(
      (error) => {
        console.error(error);
        throw new Response("Failed to add player to the game", { status: 500 });
      },
      () => redirect(`/game/${gameId}`)
    )
  );
};

export const loader = async (args: LoaderArgs) => {
  const players = await listPlayers();
  const playersInGame = await getGame(args.params.id as Game["id"]);

  if (E.isLeft(playersInGame)) {
    console.error(playersInGame.left);
    throw new Response("Server error", { status: 500 });
  }

  return pipe(
    players,
    E.map((players) => {
      // Filter out players that are already in the game
      return players.filter((player) => {
        return playersInGame.right.leaderboard.every(
          (entry) => entry.player.id !== player.id
        );
      });
    }),
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
        <label>
          Player <br />
          <select name="playerId">
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Initial score <br />
          <input name="initialScore" type="number" defaultValue="0" />
        </label>
        <br />
        <button type="submit">Add</button>
      </Form>
    </main>
  );
}
