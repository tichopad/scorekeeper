import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import * as TE from "fp-ts/TaskEither";
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
  const getResponse = pipe(
    listGames(),
    TE.map(getTopFiveForEachGame),
    TE.matchW(
      (error) => json({ error, games: null }),
      (games) => json({ error: null, games })
    )
  );

  return getResponse();
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <main>
      <div>
        <Link to="/new-game">Create new game</Link>
        <br />
        <Link to="/new-player">Create new player</Link>
      </div>
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
