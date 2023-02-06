import { useFetcher } from "@remix-run/react";
import type { Game } from "~/repositories/leaderboards.server";

type Props = Game["leaderboard"][number] & {
  gameId: string;
};

export default function Row({ gameId, player, position, score }: Props) {
  const updatePlayerScore = useFetcher();

  return (
    <tr>
      <td>#{position}</td>
      <td>{player.name}</td>
      <td>{score}</td>
      <td>
        <updatePlayerScore.Form action="/player/score" method="put">
          <input type="hidden" name="gameId" value={gameId} />
          <input type="hidden" name="playerId" value={player.id} />
          <button
            type="submit"
            name="score"
            value={score + 1}
            disabled={updatePlayerScore.state === "submitting"}
          >
            +
          </button>
        </updatePlayerScore.Form>
      </td>
    </tr>
  );
}
