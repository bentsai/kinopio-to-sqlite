#!/usr/bin/env node

const fs = require("fs");
const needle = require("needle");
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(
    "Usage:",
    process.argv[1].split("/").slice(-1) + " <database name>"
  );
  process.exit();
}

const db = args[0];
const { apiKey, lastRun } = JSON.parse(fs.readFileSync("config.json", "utf8"));

const insertSpace = async (id) => {
  try {
    const response = await needle(
      "get",
      `http://api.kinopio.club/space/${id}`,
      {
        headers: { Authorization: apiKey },
      }
    );
    if (response.statusCode == 200) {
      const {
        cards,
        connections,
        connectionTypes,
        tags,
        users,
        collaborators,
        ...space
      } = response.body;
      process.stdout.write(space.name + ": spaces");
      sqliteUtils(["insert", db, "spaces", "-", "--pk=id", "--replace"], {
        input: JSON.stringify(space),
      });
      process.stdout.write(", cards");
      sqliteUtils(["insert", db, "cards", "-", "--pk=id", "--replace"], {
        input: JSON.stringify(cards),
      });
      process.stdout.write(", connections");
      sqliteUtils(["insert", db, "connections", "-", "--pk=id", "--replace"], {
        input: JSON.stringify(connections),
      });
      process.stdout.write(", connectionTypes");
      sqliteUtils(
        ["insert", db, "connectionTypes", "-", "--pk=id", "--replace"],
        {
          input: JSON.stringify(connectionTypes),
        }
      );
      process.stdout.write(", tags\n");
      sqliteUtils(["insert", db, "tags", "-", "--pk=id", "--replace"], {
        input: JSON.stringify(tags),
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const insertSpaces = async () => {
  try {
    const response = await needle(
      "get",
      "http://api.kinopio.club/user/spaces",
      {
        headers: { Authorization: apiKey },
      }
    );
    if (response.statusCode == 200) {
      for (const space of response.body) {
        if (lastRun == null || new Date(lastRun) < new Date(space.updatedAt)) {
          await insertSpace(space.id);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const postProcess = () => {
  sqliteUtils(["enable-fts", db, "cards", "name", "--create-triggers"]);
  sqliteUtils(["enable-fts", db, "spaces", "name", "--create-triggers"]);
  sqliteUtils([
    "enable-fts",
    db,
    "connectionTypes",
    "name",
    "--create-triggers",
  ]);
  sqliteUtils(["enable-fts", db, "tags", "name", "--create-triggers"]);
  sqliteUtils([
    "add-foreign-keys",
    db,
    "spaces",
    "originSpaceId",
    "spaces",
    "id",
    "cards",
    "spaceId",
    "spaces",
    "id",
    "cards",
    "linkToSpaceId",
    "spaces",
    "id",
    "tags",
    "spaceId",
    "spaces",
    "id",
    "connections",
    "spaceId",
    "spaces",
    "id",
    "connectionTypes",
    "spaceId",
    "spaces",
    "id",
    "connections",
    "startCardId",
    "cards",
    "id",
    "connections",
    "endCardId",
    "cards",
    "id",
  ]);
};

const sqliteUtils = (args, options) => {
  const { error } = spawnSync("sqlite-utils", args, options);
  if (error) console.error({ error });
};

insertSpaces()
  .then(() => {
    postProcess();
    fs.writeFileSync(
      "config.json",
      JSON.stringify({ apiKey: apiKey, lastRun: new Date() }, "utf8")
    );
  })
  .catch((e) => console.error(e));
