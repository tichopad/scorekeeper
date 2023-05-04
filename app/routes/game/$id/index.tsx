import { json, type LoaderArgs } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import Leaderboard from "~/components/Leaderboard";
import { Schema as GameSchema, get as getGame } from "~/models/game.server";
import { validateWithSchemaAsync } from "~/utils/validation";

const ParamsSchema = GameSchema.pick({ id: true });

export const loader = async ({ params }: LoaderArgs) => {
  const getResponse = pipe(
    params,
    validateWithSchemaAsync(ParamsSchema),
    TE.chainW(({ id }) => getGame(id)),
    TE.match(
      (error) => {
        console.error(error);
        throw new Response("Server error", { status: 500 });
      },
      (game) => json({ game })
    )
  );

  return getResponse();
};

export default function GameDetail() {
  const { game } = useLoaderData<typeof loader>();

  return (
    <main>
      <Link to="..">Back</Link>
      <br />
      <Link to="./add-player">Add player</Link>
      <h1>Game detail</h1>
      <Leaderboard hasMorePlayers={false} {...game} />
    </main>
  );
}
