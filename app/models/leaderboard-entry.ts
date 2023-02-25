import { z } from "zod";
import * as Player from "./player";

export const Schema = z.object({
  position: z.number().positive().int(),
  player: Player.Schema,
  score: z.number().int().default(0),
});

export type LeaderboardEntry = z.infer<typeof Schema>;
