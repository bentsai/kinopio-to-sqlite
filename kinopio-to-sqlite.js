#!/usr/bin/env node

const fs = require("fs");
const needle = require("needle");
const { spawnSync } = require("child_process");

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
      console.log(space.name);
      sqliteUtils(["insert", "kinopio.db", "spaces", "-", "--pk=id"], {
        input: JSON.stringify(space),
      });
      sqliteUtils(["insert", "kinopio.db", "cards", "-", "--pk=id"], {
        input: JSON.stringify(cards),
      });
      sqliteUtils(["insert", "kinopio.db", "connections", "-", "--pk=id"], {
        input: JSON.stringify(connections),
      });
      sqliteUtils(["insert", "kinopio.db", "connectionTypes", "-", "--pk=id"], {
        input: JSON.stringify(connectionTypes),
      });
      sqliteUtils(["insert", "kinopio.db", "tags", "-", "--pk=id"], {
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
  sqliteUtils([
    "enable-fts",
    "kinopio.db",
    "cards",
    "name",
    "--create-triggers",
  ]);
  sqliteUtils([
    "enable-fts",
    "kinopio.db",
    "spaces",
    "name",
    "--create-triggers",
  ]);
  sqliteUtils([
    "enable-fts",
    "kinopio.db",
    "connectionTypes",
    "name",
    "--create-triggers",
  ]);
  sqliteUtils([
    "enable-fts",
    "kinopio.db",
    "tags",
    "name",
    "--create-triggers",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "cards",
    "spaceId",
    "spaces",
    "id",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "connections",
    "spaceId",
    "spaces",
    "id",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "connections",
    "startCardId",
    "cards",
    "id",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "connections",
    "endCardId",
    "cards",
    "id",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "connections",
    "connectionTypeId",
    "connectionTypes",
    "id",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "connectionTypes",
    "spaceId",
    "spaces",
    "id",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "tags",
    "cardId",
    "cards",
    "id",
  ]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "tags",
    "spaceId",
    "spaces",
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
