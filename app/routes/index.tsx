import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import Leaderboard from "~/components/Leaderboard";
import { list as listGames, type Game } from "~/models/game.server";

const getTopFiveForEachGame = (games: Array<Game>) => {
  return games.map((game) => ({
    ...game,
    leaderboard: game.leaderboard.slice(0, 5),
    hasMorePlayers: game.leaderboard.length > 5,
  }));
};

export const loader = async () => {
  const games = await listGames();

  return pipe(
    games,
    E.map(getTopFiveForEachGame),
    E.matchW(
      (error) => json({ error, games: null }),
      (games) => json({ error: null, games })
    )
  );
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
        data.games.map((game) => <Leaderboard key={game.id} {...game} />)
      )}
    </main>
  );
}
