import { Link } from "@remix-run/react";
import type { Game } from "~/models/game.server";
import Row from "./Row";

type Props = Game & {
  hasMorePlayers: boolean;
};

export default function Leaderboard({
  id,
  hasMorePlayers,
  leaderboard,
  name,
}: Props) {
  return (
    <article>
      <h2>
        <Link to={`/game/${id}`}>{name}</Link>
      </h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => (
            <Row key={id + entry.player.id} gameId={id} {...entry} />
          ))}
          {hasMorePlayers ? <More gameId={id} /> : null}
        </tbody>
      </table>
    </article>
  );
}

type MoreProps = {
  gameId: string;
};

function More({ gameId }: MoreProps) {
  return (
    <tr>
      <td colSpan={3}>
        <Link to={`/game/${gameId}`}>More</Link>
      </td>
    </tr>
  );
}
