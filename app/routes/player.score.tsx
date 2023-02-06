import { json, type ActionArgs } from "@remix-run/cloudflare";
import {
  getLeaderboardEntry,
  updateScore,
} from "~/repositories/leaderboards.server";
import { assert } from "~/utils";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const gameId = formData.get("gameId");
  const playerId = formData.get("playerId");
  const newScoreRaw = formData.get("score");

  assert(gameId && typeof gameId === "string", "Game ID is required");
  assert(playerId && typeof playerId === "string", "Player ID is required");
  assert(newScoreRaw && typeof newScoreRaw === "string", "Score is required");

  const newScore = Number(newScoreRaw);
  assert(!isNaN(newScore), "Score has invalid number format");

  const leaderboardEntry = await getLeaderboardEntry(gameId, playerId);
  assert(leaderboardEntry !== null, "Cannot find leaderboard entry");

  if (leaderboardEntry.score === newScore) return json({ leaderboardEntry });

  assert(
    Math.abs(newScore - leaderboardEntry.score) === 1,
    "Score can only be incremented"
  );

  const updatedLeaderboardEntry = await updateScore(gameId, playerId, newScore);

  return json({ leaderboardEntry: updatedLeaderboardEntry });
};
