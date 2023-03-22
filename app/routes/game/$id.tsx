import { json, type LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import Leaderboard from "~/components/Leaderboard";
import { get as getGame, type Game } from "~/models/game.server";
import { assert } from "~/utils";

export const loader = async ({ params }: LoaderArgs) => {
  // TODO: validate + Either
  assert(params.id, "No game id provided");
  // TODO: validate
  const game = await getGame(params.id as Game["id"]);

  return pipe(
    game,
    E.match(
      (error) => {
        console.error(error);
        throw new Response("Server error", { status: 500 });
      },
      (game) => json({ game })
    )
  );
};

export default function GameDetail() {
  const { game } = useLoaderData<typeof loader>();

  return (
    <main>
      <h1>Game detail</h1>
      <Leaderboard hasMorePlayers={false} {...game} />
    </main>
  );
}
