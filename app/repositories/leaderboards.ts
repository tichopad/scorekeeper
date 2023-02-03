import games from "./games.json";

type PlayerID = string;
type GameID = string;

export type Player = {
  name: string;
  id: PlayerID;
};

type LeaderboardEntry = {
  position: number;
  player: Player;
  score: number;
};

export type Game = {
  name: string;
  id: GameID;
  leaderboard: Array<LeaderboardEntry>;
};

export async function getAllGamesWithTopFiveLeaderboards(): Promise<
  Array<Game>
> {
  return games.map((game) => ({
    ...game,
    leaderboard: game.leaderboard.slice(0, 5),
  }));
}
