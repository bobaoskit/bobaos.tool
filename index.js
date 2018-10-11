const readline = require("readline");

const colors = require("colors/safe");
const Bobaos = require("bobaos.sub");

const parseCmd = require("./parseCmd");

let bobaos = Bobaos({ socketFile: "/var/run/myps/myipc.sock" });

bobaos.on("connect", _ => {
  console_out("connected to ipc, still not subscribed to channels");
});

bobaos.on("ready", _ => {
  console_out("ready to send requests");
});

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

// register datapoint value listener
bobaos.on("datapoint value", payload => {
  console_out(payload);
});

rl.on("line", line => {
  rl.prompt(true);
  try {
    console_out(parseCmd(line));
  } catch (e) {
    console_out(e);
  }
}).on("close", () => {
  console.log("Have a great day, friend!");
  process.exit(0);
});
