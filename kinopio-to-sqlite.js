#!/usr/bin/env node

const fs = require("fs");
const needle = require("needle");
const { spawnSync } = require("child_process");

const { apiKey } = JSON.parse(fs.readFileSync("config.json", "utf8"));

const insertSpace = async (id) => {
  try {
    const response = await needle("get", `http://api.kinopio.club/space/${id}`, {
      headers: { Authorization: apiKey },
    });
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
      spawnSync(
        "sqlite-utils",
        ["insert", "kinopio.db", "spaces", "-", "--pk=id"],
        {
          input: JSON.stringify(space),
        }
      );
      spawnSync(
        "sqlite-utils",
        ["insert", "kinopio.db", "cards", "-", "--pk=id"],
        {
          input: JSON.stringify(cards),
        }
      );
      spawnSync(
        "sqlite-utils",
        ["insert", "kinopio.db", "connections", "-", "--pk=id"],
        {
          input: JSON.stringify(connections),
        }
      );
      spawnSync(
        "sqlite-utils",
        ["insert", "kinopio.db", "connectionTypes", "-", "--pk=id"],
        {
          input: JSON.stringify(connectionTypes),
        }
      );
      spawnSync(
        "sqlite-utils",
        ["insert", "kinopio.db", "tags", "-", "--pk=id"],
        {
          input: JSON.stringify(tags),
        }
      );
    }
  } catch (error) {
    console.log(error);
  }
};

needle.get(
  "http://api.kinopio.club/user/spaces",
  { headers: { Authorization: apiKey } },
  function (error, response) {
    if (!error && response.statusCode == 200) {
      for (var i = 0; i < response.body.length; i++) {
        var space = response.body[i];
        insertSpace(space.id);
      }
      postProcess();
    } else {
      console.log(response && response.statusCode);
      console.log({ error });
    }
  }
);

const postProcess = () => {
  spawnSync("sqlite-utils", ["enable-fts", "kinopio.db", "cards", "name"]);
  spawnSync("sqlite-utils", ["enable-fts", "kinopio.db", "spaces", "name"]);
  spawnSync("sqlite-utils", ["enable-fts", "kinopio.db", "connections", "name"]);
  spawnSync("sqlite-utils", ["enable-fts", "kinopio.db", "connectionTypes", "name"]);
  spawnSync("sqlite-utils", ["enable-fts", "kinopio.db", "tags", "name"]);
  spawnSync("sqlite-utils", [
    "add-foreign-keys",
    "kinopio.db",
    "cards",
    "spaceId",
    "spaces",
    "id",
  ]);
};
