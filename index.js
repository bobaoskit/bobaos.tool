const readline = require("readline");

const parseCmd = require("./parseCmd");

/// init repl
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "bobaos> "
});

const console_out = msg => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(msg);
  rl.prompt(true);
};

rl.prompt();

console_out("hello, friend");


rl.on("line", line => {
  rl.prompt(true);
  try {
    console_out(parseCmd(line))
  } catch (e) {
    console_out(e)
  }
}).on("close", () => {
  console.log("Have a great day, friend!");
  process.exit(0);
});
