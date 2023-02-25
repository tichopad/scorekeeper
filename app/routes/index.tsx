import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import Leaderboard from "~/components/Leaderboard";
import * as gamesRepository from "~/repositories/games.server";
import * as E from "fp-ts/Either";

export const loader = async () => {
  const games = await gamesRepository.getAll();

  if (E.isLeft(games)) {
    return json({
      error: games.left,
      gamesWithTopFiveLeaderboards: null,
    });
  }

  const gamesWithTopFiveLeaderboards = games.right.map((game) => ({
    ...game,
    leaderboard: game.leaderboard.slice(0, 5),
    hasMorePlayers: game.leaderboard.length > 5,
  }));

  return json({
    error: null,
    gamesWithTopFiveLeaderboards,
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <main>
      <Link to="/new-game">Create new game</Link>
      <h1>Leaderboards</h1>
      {data.error ? (
        <p>
          Error getting games: <pre>{data.error.name}</pre>
        </p>
      ) : (
        data.gamesWithTopFiveLeaderboards.map((game) => (
          <Leaderboard key={game.id} {...game} />
        ))
      )}
    </main>
  );
}
