import { json, type LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import Leaderboard from "~/components/Leaderboard";
import { getGame } from "~/repositories/leaderboards.server";
import { assert } from "~/utils";

export const loader = async ({ params }: LoaderArgs) => {
  assert(params.id, "No game ID provided");
  const game = await getGame(params.id);

  if (game === null) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  return json({ game });
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
