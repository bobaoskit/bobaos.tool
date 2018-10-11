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

// add upport for color output
let mycolors = [];
for (let i = 0; i < 1000; i += 1) {
  mycolors.push("default");
}

const formatDate = date => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let milliseconds = date.getMilliseconds();
  milliseconds = parseInt(milliseconds, 10) < 10 ? "0" + milliseconds : milliseconds;
  milliseconds = parseInt(milliseconds, 10) < 100 ? "0" + milliseconds : milliseconds;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  seconds = seconds < 10 ? "0" + seconds : seconds;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return `${hours}:${minutes}:${seconds}:${milliseconds}`;
};

const formatDatapointValue = data => {
  const strValue = `${formatDate(new Date())},    id: ${data.id}, value: ${data.value}, raw: [${data.raw}]`;

  // now color it
  const datapointColor = mycolors[data.id];
  if (datapointColor === "default") {
    return strValue;
  }
  if (typeof colors[datapointColor] === "function") {
    return colors[datapointColor](strValue);
  }

  return strValue;
};

const formatDatapointDescription = t => {
  return `#${t.id}: length = ${t.length}, dpt = ${t.dpt},  prio: ${t.flags.priority}  flags: [${
    t.flags.communication ? "C" : "-"
  }${t.flags.read ? "R" : "-"}${t.flags.write ? "W" : "-"}${t.flags.transmit ? "T" : "-"}${
    t.flags.update ? "U" : "-"
  }]`;
};

// register datapoint value listener
bobaos.on("datapoint value", payload => {
  // if multiple values
  if (Array.isArray(payload)) {
    console_out(payload.map(formatDatapointValue));

    return;
  }

  console_out(formatDatapointValue(payload));
});

const processParsedCmd = async payload => {
  try {
    let { command, args } = payload;
    let res;
    switch (command) {
      case "set":
        await bobaos.setValue(args);
        break;
      case "get":
        res = await bobaos.getValue(args);
        res.forEach(t => {
          console_out(formatDatapointValue(t));
        });
        break;
      case "stored":
        res = await bobaos.getStoredValue(args);
        res.forEach(t => {
          console_out(formatDatapointValue(t));
        });
        break;
      case "read":
        res = await bobaos.readValue(args);
        break;
      case "description":
        if (args === "*") {
          args = null;
        }
        res = await bobaos.getDescription(args);
        res.map(formatDatapointDescription).forEach(console_out);
        break;
      case "getbyte":
        res = await bobaos.getParameterByte(args);
        console_out(res);
        break;
      case "watch":
        args.forEach(a => {
          let { id, color } = a;
          mycolors[id] = color;
          console_out(`datapoint ${id} value is now in ${color}`);
        });
        break;
      case "unwatch":
        args.forEach(id => {
          mycolors[id] = "default";
          console_out(`datapoint ${id} value is now in default color`);
        });
        break;
      case "ping":
        res = await bobaos.ping();
        console_out(`ping: ${res}`);
        break;
      case "state":
        res = await bobaos.getSdkState();
        console_out(`get sdk state: ${res}`);
        break;
      case "reset":
        res = await bobaos.reset();
        console_out(`reset request sent`);
        break;
      case "getitem":
        if (args === "*") {
          args = null;
        }
        res = await bobaos.getServerItem(args);
        console_out(res);
        break;
      case "progmode":
        if (args !== "?") {
          await bobaos.setProgrammingMode(args);
        }
        res = await bobaos.getProgrammingMode();
        console_out(`BAOS module in programming mode: ${res}`);
        break;
      case "help":
        console_out(`:: To work with datapoints`);
        console_out(`::  set ( 1: true | [2: "hello", 3: 42] )`);
        console_out(`::> get ( 1 2 3 | [1, 2, 3] )`);
        console_out(`::  stored ( 1 2 3 | [1, 2, 3] )`);
        console_out(`::> read ( 1 2 3 | [1, 2, 3] )`);
        console_out(`::  description ( * | 1 2 3 | [1, 2, 3] )`);
        console_out(` `);
        console_out(`:: Helpful in bus monitoring:`);
        console_out(`::> watch ( 1: red | [1: red, 2: green, 3: underline] ) `);
        console_out(`::  unwatch ( 1 2 3 | [1, 2, 3] )`);
        console_out(` `);
        console_out(`:: BAOS services: `);
        console_out(`::> getbyte ( 1 2 3 | [1, 2, 3] ) `);
        console_out(`::  getitem ( * | ServerItem1 Item2... | [Item1, Item2, ..] ) `);
        console_out(`::> progmode ( ? | true/false/1/0 ) `);
        console_out(` `);
        console_out(`:: General: `);
        console_out(`::> ping `);
        console_out(`::  state `);
        console_out(`::> reset `);
        console_out(`::  help `);
        break;
      default:
        break;
    }
  } catch (e) {
    console_out(e.message);
  }
};

rl.on("line", line => {
  rl.prompt(true);
  try {
    processParsedCmd(parseCmd(line));
  } catch (e) {
    console_out(e.message);
  }
}).on("close", () => {
  console.log("Have a great day, friend!");
  process.exit(0);
});
