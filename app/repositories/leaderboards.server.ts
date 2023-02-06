import hyperId from "hyperid";
import fakeGames from "./games.json";

const seedStore = async () => {
  await STORE.put("games", JSON.stringify(fakeGames));
};

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

function readGamesFromStore() {
  return STORE.get("games").then((value) => value && JSON.parse(value));
}
async function loadGames() {
  const games = await readGamesFromStore();
  if (games) {
    return games as Array<Game>;
  } else {
    await seedStore();
    const seededGames = await readGamesFromStore();
    return seededGames as Array<Game>;
  }
}

export function getAllGames(): Promise<Array<Game>> {
  return loadGames();
}

export async function getGame(id: string): Promise<Game | null> {
  const games = await getAllGames();
  return games.find((game) => game.id === id) ?? null;
}

export async function createGame(name: string): Promise<Game> {
  const generateId = hyperId({ urlSafe: true });
  const newGame: Game = {
    id: generateId(),
    name,
    leaderboard: [],
  };
  const games = await loadGames();
  await STORE.put("games", JSON.stringify([...games, newGame]));
  return newGame;
}
