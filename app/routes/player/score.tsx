import { json, type ActionArgs } from "@remix-run/cloudflare";
import * as E from "fp-ts/Either";
import type { Game } from "~/models/game.server";
import {
  getLeaderboardEntry,
  updateLeaderboardEntry,
} from "~/models/game.server";
import type { Player } from "~/models/player.server";
import { assert } from "~/utils";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const gameId = formData.get("gameId");
  const playerId = formData.get("playerId");
  const newScoreRaw = formData.get("score");

  // const x = GameSchema.shape.id.parse(gameId)

  // TODO: asserts into Either
  assert(gameId && typeof gameId === "string", "Game ID is required");
  assert(playerId && typeof playerId === "string", "Player ID is required");
  assert(newScoreRaw && typeof newScoreRaw === "string", "Score is required");

  const newScore = Number(newScoreRaw);
  assert(!isNaN(newScore), "Score has invalid number format");

  const leaderboardEntry = await getLeaderboardEntry(
    gameId as Game["id"],
    playerId as Player["id"]
  );

  if (E.isLeft(leaderboardEntry)) return E.throwError(leaderboardEntry);

  if (leaderboardEntry.right.score === newScore) {
    return json({ leaderboardEntry });
  }

  assert(
    Math.abs(newScore - leaderboardEntry.right.score) === 1,
    "Score can only be incremented"
  );

  const updatedLeaderboardEntry = await updateLeaderboardEntry(
    gameId as Game["id"],
    playerId as Player["id"],
    { score: newScore }
  );

  return json({ leaderboardEntry: updatedLeaderboardEntry });
};
