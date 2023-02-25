import { faker } from "@faker-js/faker";
import fs from "fs/promises";
import { performance } from "perf_hooks";
import hyperid from "hyperid";
import path from "path";
import { type Type } from "~/models/game";
import { type LeaderboardEntry } from "~/models/leaderboard-entry";
import { type Type } from "~/models/player";

// Create an array of numbers in a given range
function range(size: number): Array<number> {
  return new Array(size).fill(null).map((_, i) => i + 1);
}

// Generate players entries
const playersEntries = range(15).map(() => {
  const generateId = hyperid({ urlSafe: true });
  const player: Type = {
    id: generateId() as Type["id"],
    name: faker.name.fullName(),
  };
  return [`player#${player.id}`, player] as const;
});

// Generate game entries
const gamesEntries = range(5).map(() => {
  const generateId = hyperid({ urlSafe: true });
  const id = generateId() as Type["id"];
  const game: Type = {
    id,
    name: faker.company.name(),
    leaderboard: range(
      faker.datatype.number({ min: 1, max: playersEntries.length - 1 })
    ).map((i) => {
      const leaderboard: LeaderboardEntry = {
        player: playersEntries[i][1] as Type,
        position: i,
        score: 200 - i,
      };
      return leaderboard;
    }),
  };
  return [`game#${game.id}`, game] as const;
});

// Entire generated data set
const data = [...gamesEntries, ...playersEntries];

// Path to Miniflare's KV persistence dir
const kvNamespace = "STORE";
const kvPersistenceDir = path.resolve(
  __dirname,
  "..",
  ".mf",
  "kv",
  kvNamespace
);

const start = performance.now();
fs.rm(kvPersistenceDir, { force: true, recursive: true })
  .then(() => {
    return fs.mkdir(kvPersistenceDir, { recursive: true });
  })
  .then(() => {
    const writes = data.map(([key, value]) =>
      fs.writeFile(path.resolve(kvPersistenceDir, key), JSON.stringify(value), {
        encoding: "utf8",
      })
    );
    return Promise.all(writes);
  })
  .then((writes) => {
    const elapsed = performance.now() - start;
    console.log(
      `Seeded ${writes.length} entries in ${Math.floor(elapsed)} ms.`
    );
  });
