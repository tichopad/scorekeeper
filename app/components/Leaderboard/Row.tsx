import type { Game } from "~/repositories/leaderboards";

type Props = Game["leaderboard"][number];

export default function Row({ player, position, score }: Props) {
  return (
    <tr>
      <td>#{position}</td>
      <td>{player.name}</td>
      <td>{score}</td>
    </tr>
  );
}
