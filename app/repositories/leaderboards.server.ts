import hyperId from "hyperid";
import { slugify } from "~/utils";
import fakeGames from "./games";

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
  slug: string;
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

export async function getGame(name: string): Promise<Game | null> {
  const games = await getAllGames();
  return games.find((game) => game.name === name) ?? null;
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const games = await getAllGames();
  return games.find((game) => game.slug === slug) ?? null;
}

export async function createGame(name: string): Promise<Game> {
  const generateId = hyperId({ urlSafe: true });
  const newGame: Game = {
    id: generateId(),
    name,
    slug: slugify(name),
    leaderboard: [],
  };
  const games = await loadGames();
  await STORE.put("games", JSON.stringify([...games, newGame]));
  return newGame;
}

export async function getLeaderboardEntry(
  gameId: string,
  playerId: string
): Promise<LeaderboardEntry | null> {
  const game = await getGame(gameId);
  const leaderboardEntry = game?.leaderboard.find(
    (entry) => entry.player.id === playerId
  );
  return leaderboardEntry ?? null;
}

export async function updateScore(
  gameId: string,
  playerId: string,
  newScore: number
): Promise<LeaderboardEntry | null> {
  const currentLeaderboardEntry = await getLeaderboardEntry(gameId, playerId);

  if (currentLeaderboardEntry === null) return null;

  const newLeaderboardEntry: typeof currentLeaderboardEntry = {
    ...currentLeaderboardEntry,
    score: newScore,
  };

  const games = await getAllGames();
  const newGames: typeof games = games.map((game) => {
    if (game.id !== gameId) return game;
    else
      return {
        ...game,
        leaderboard: game.leaderboard.map((entry) => {
          if (entry.player.id !== playerId) return entry;
          else return newLeaderboardEntry;
        }),
      };
  });

  await STORE.put("games", JSON.stringify(newGames));

  return newLeaderboardEntry;
}
