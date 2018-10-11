#!/usr/bin/env node

const program = require("commander");

program.option("-s --sockfile <path>", `path to socket file if not default.`).parse(process.argv);

let params = {};

if (program["sockfile"]) {
  params.socketFile = program["sockfile"];
}

require("../index.js")(params);
