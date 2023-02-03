import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import Leaderboard from "~/components/Leaderboard";
import { getAllGamesWithTopFiveLeaderboards } from "~/repositories/leaderboards";

export const loader = async () => {
  return json({
    gamesWithTopFiveLeaderboards: await getAllGamesWithTopFiveLeaderboards(),
  });
};

export default function Index() {
  const { gamesWithTopFiveLeaderboards } = useLoaderData<typeof loader>();

  return (
    <main>
      <h1>Leaderboards</h1>
      {gamesWithTopFiveLeaderboards.map((game) => (
        <Leaderboard key={game.id} game={game} />
      ))}
    </main>
  );
}
