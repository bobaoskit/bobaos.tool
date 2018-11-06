#!/usr/bin/env node

const program = require("commander");

program.option("-r --redis <path>", `path to redis server if not default.`).parse(process.argv);

let params = {};

if (program["redis"]) {
  params.redis = program["redis"];
}

require("../index.js")(params);
