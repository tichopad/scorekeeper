import type { Game } from "~/repositories/leaderboards";
import Row from "./Row";

type Props = {
  game: Game;
};

export default function Leaderboard({ game }: Props) {
  return (
    <article>
      <h2>{game.name}</h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {game.leaderboard.map((entry) => (
            <Row key={game.id + entry.player.id} {...entry} />
          ))}
        </tbody>
      </table>
    </article>
  );
}
