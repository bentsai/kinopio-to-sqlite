#!/usr/bin/env node

const fs = require("fs");
const needle = require("needle");
const { spawnSync } = require("child_process");

const { apiKey } = JSON.parse(fs.readFileSync("config.json", "utf8"));

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
      for (var i = 0; i < response.body.length; i++) {
        var space = response.body[i];
        insertSpace(space.id);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const postProcess = () => {
  sqliteUtils(["enable-fts", "kinopio.db", "cards", "name"]);
  sqliteUtils(["enable-fts", "kinopio.db", "spaces", "name"]);
  sqliteUtils(["enable-fts", "kinopio.db", "connections", "name"]);
  sqliteUtils(["enable-fts", "kinopio.db", "connectionTypes", "name"]);
  sqliteUtils(["enable-fts", "kinopio.db", "tags", "name"]);
  sqliteUtils([
    "add-foreign-keys",
    "kinopio.db",
    "cards",
    "spaceId",
    "spaces",
    "id",
  ]);
};

const sqliteUtils = (args, options) => {
  console.log("sqliteUtils", args);
  const { error } = spawnSync("sqlite-utils", args, options);
  if (error) console.error({ error });
};

await insertSpaces();

console.log("running now...");
postProcess();

/*
insertSpaces()
  .then(() => {
    console.log("running now...");
    postProcess();
  })
  .catch((e) => console.log(e));
  */
