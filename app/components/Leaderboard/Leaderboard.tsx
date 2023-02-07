import { Link } from "@remix-run/react";
import type { Game } from "~/repositories/leaderboards.server";
import Row from "./Row";

type Props = Game & {
  hasMorePlayers: boolean;
};

export default function Leaderboard({
  id,
  hasMorePlayers,
  leaderboard,
  name,
  slug,
}: Props) {
  return (
    <article>
      <h2>
        <Link to={`/game/${slug}`}>{name}</Link>
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
          {hasMorePlayers ? <More gameSlug={slug} /> : null}
        </tbody>
      </table>
    </article>
  );
}

type MoreProps = {
  gameSlug: string;
};

function More({ gameSlug }: MoreProps) {
  return (
    <tr>
      <td colSpan={3}>
        <Link to={`/game/${gameSlug}`}>More</Link>
      </td>
    </tr>
  );
}
