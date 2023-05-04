import { type ActionArgs } from "@remix-run/cloudflare";
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
    TE.Do,
    TE.bind("formData", () => getFormData),
    TE.bind("leaderboardEntry", ({ formData }) =>
      getLeaderboardEntry(formData.gameId, formData.playerId)
    ),
    TE.chainW(({ formData, leaderboardEntry }) => {
      if (Math.abs(formData.score - leaderboardEntry.score) !== 1) {
        return TE.throwError(new Error("Score can only be incremented"));
      }
      // Score didn't change, so no need to update
      if (formData.score === leaderboardEntry.score) {
        return TE.of(leaderboardEntry);
      }
      return updateLeaderboardEntry(formData.gameId, formData.playerId, {
        score: formData.score,
      });
    })
  );

  return getResponse();
};
