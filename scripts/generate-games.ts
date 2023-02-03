import { faker } from "@faker-js/faker";
import fs from "fs/promises";
import path from "path";

const NUMBER_OF_GAMES = 4;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 20;

function range(size: number): Array<number> {
  return new Array(size).fill(null).map((_, i) => i + 1);
}

const games = range(NUMBER_OF_GAMES).map(() => ({
  id: faker.datatype.uuid(),
  name: faker.internet.domainWord().replace("-", " "),
  leaderboard: range(
    faker.datatype.number({
      min: MIN_PLAYERS,
      max: MAX_PLAYERS,
    })
  ).map((i) => ({
    position: i,
    score: 200 - i,
    player: {
      id: faker.datatype.uuid(),
      name: faker.name.fullName(),
    },
  })),
}));

const filePath = path.resolve(__dirname, "generated-games.json");
fs.rm(filePath, { force: true })
  .then(() =>
    fs.writeFile(filePath, JSON.stringify(games, null, 2), {
      encoding: "utf8",
    })
  )
  .then(() => console.log(`Generated @ ${filePath}`));
