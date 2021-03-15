#!/usr/bin/env node

const fs = require("fs");
const needle = require("needle");
const { spawnSync } = require("child_process");

const { apiKey } = JSON.parse(fs.readFileSync("config.json", "utf8"));

const insertSpace = (id) => {
  needle.get(
    `http://api.kinopio.club/space/${id}`,
    { headers: { Authorization: apiKey } },
    function (error, response) {
      if (!error && response.statusCode == 200) {
        const {
          cards,
          connections,
          connectionTypes,
          tags,
          users,
          collaborators,
          ...space
        } = response.body;
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
      }
    }
  );
};

needle.get(
  "http://api.kinopio.club/user/spaces",
  { headers: { Authorization: apiKey } },
  function (error, response) {
    if (!error && response.statusCode == 200) {
      response.body.forEach((space) => insertSpace(space.id));
      postProcess();
    }
  }
);

const postProcess = () => {
  spawnSync("sqlite-utils", ["enable-fts", "kinopio.db", "cards", "name"]);
  spawnSync("sqlite-utils", ["enable-fts", "kinopio.db", "spaces", "name"]);
  spawnSync("sqlite-utils", [
    "add-foreign-keys",
    "kinopio.db",
    "cards",
    "spaceId",
    "spaces",
    "id",
  ]);
};
