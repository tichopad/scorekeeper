import {
  json,
  redirect,
  type ActionArgs,
  type LoaderArgs,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { z } from "zod";
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
  type Player,
} from "~/models/player.server";
import { runTasksInParallel } from "~/utils/generic";
import {
  validateFormDataAsync,
  validateWithSchemaAsync,
} from "~/utils/validation";

const FormSchema = z.object({
  playerId: PlayerSchema.shape.id,
  initialScore: GameSchema.shape.leaderboard.element.shape.score,
});

export const action = async ({ request, params }: ActionArgs) => {
  const getGameId = pipe(
    params.id,
    validateWithSchemaAsync(GameSchema.shape.id)
  );

  const getFormData = pipe(
    TE.tryCatch(
      () => request.formData(),
      (error) => new Error(`Failed to get form data: ${error}`)
    ),
    TE.chain(validateFormDataAsync(FormSchema))
  );

  const getResponse = pipe(
    TE.Do,
    TE.bind("gameId", () => getGameId),
    TE.bind("formData", () => getFormData),
    TE.map(({ gameId, formData }) =>
      pipe(
        getPlayer(formData.playerId),
        TE.map((player) =>
          addPlayerToLeaderboard(gameId, player, formData.initialScore)
        ),
        TE.match(
          (error) =>
            new Response(`Failed to add player to the game: ${error}`, {
              status: 500,
            }),
          () => redirect(`/game/${gameId}`)
        )
      )
    )
  );

  return getResponse();
};

export const loader = async ({ params }: LoaderArgs) => {
  const filterOutPlayersAlreadyInGame = (players: Player[], game: Game) => {
    return players.filter((player) =>
      game.leaderboard.every((entry) => entry.player.id !== player.id)
    );
  };

  const getResponse = pipe(
    params.id,
    validateWithSchemaAsync(GameSchema.shape.id),
    TE.chain((gameId) =>
      runTasksInParallel({
        allPlayers: listPlayers(),
        game: getGame(gameId),
      })
    ),
    TE.map(({ allPlayers, game }) =>
      filterOutPlayersAlreadyInGame(allPlayers, game)
    ),
    TE.match(
      (error) => {
        throw new Response(`Failed to load players: ${error.message}`, {
          status: 500,
        });
      },
      (players) => json({ players })
    )
  );

  return getResponse();
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
