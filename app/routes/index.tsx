import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import Leaderboard from "~/components/Leaderboard";
import { getAllGames } from "~/repositories/leaderboards.server";

export const loader = async () => {
  const games = await getAllGames();
  const gamesWithTopFiveLeaderboards = games.map((game) => ({
    ...game,
    leaderboard: game.leaderboard.slice(0, 5),
    hasMorePlayers: game.leaderboard.length > 5,
  }));

  return json({
    gamesWithTopFiveLeaderboards,
  });
};

export default function Index() {
  const { gamesWithTopFiveLeaderboards } = useLoaderData<typeof loader>();

  return (
    <main>
      <Link to="/new-game">Create new game</Link>
      <h1>Leaderboards</h1>
      {gamesWithTopFiveLeaderboards.map((game) => (
        <Leaderboard key={game.id} {...game} />
      ))}
    </main>
  );
}
