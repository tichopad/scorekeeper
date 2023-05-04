import { json, type ActionArgs } from "@remix-run/cloudflare";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { z } from "zod";
import {
  Schema as GameSchema,
  getLeaderboardEntry,
  updateLeaderboardEntry,
} from "~/models/game.server";
import { Schema as PlayerSchema } from "~/models/player.server";
import { validateFormDataAsync } from "~/utils/validation";

const FormSchema = z.object({
  gameId: GameSchema.shape.id,
  playerId: PlayerSchema.shape.id,
  score: GameSchema.shape.leaderboard.element.shape.score,
});

export const action = async ({ request }: ActionArgs) => {
  const getFormData = pipe(
    TE.tryCatch(
      () => request.formData(),
      (error) => new Error(`Failed to get form data: ${error}`)
    ),
    TE.chain(validateFormDataAsync(FormSchema))
  );

  const getResponse = pipe(
    getFormData,
    TE.map(({ gameId, playerId, score }) =>
      pipe(
        getLeaderboardEntry(gameId, playerId),
        TE.chainW((leaderboardEntry) => {
          if (Math.abs(score - leaderboardEntry.score) !== 1) {
            return TE.throwError(new Error("Score can only be incremented"));
          }
          if (score === leaderboardEntry.score) {
            return TE.of(leaderboardEntry);
          }
          return updateLeaderboardEntry(gameId, playerId, { score });
        }),
        TE.map((leaderboardEntry) => json({ leaderboardEntry }))
      )
    )
  );

  return getResponse();
};
