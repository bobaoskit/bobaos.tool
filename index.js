const path = require("path");

const readline = require("readline");

const colors = require("colors/safe");
const Bobaos = require("bobaos.sub");

const parseCmd = require("./parseCmd");
const configFile = require("./config");
const config = configFile.get();

const App = params => {
  let _params = {};
  Object.assign(_params, params);

  let bobaos = Bobaos(_params);

  /// init repl
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "bobaos> ",
    completer: completer
  });

  const console_out = msg => {
    if (msg) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      console.log(msg);
      setTimeout(_ => {
        rl.prompt(true);
      }, 100);
    }
  };

  bobaos.on("connect", _ => {
    console_out("connected to ipc, still not subscribed to channels");
  });

  bobaos.on("ready", _ => {
    console_out("ready to send requests");
    rl.prompt();
  });

  bobaos.on("error", e => {
    console_out(`Error with bobaos module: ${e.message}`);
  });

  let commandlist = [];
  commandlist.push("set", "get", "stored", "read", "description");
  commandlist.push("watch", "unwatch");
  commandlist.push("getbyte", "getitem", "progmode");
  commandlist.push("ping", "state", "reset", "help");
  function completer(line) {
    const hits = commandlist.filter(c => c.startsWith(line));

    // show all completions if none found
    return [hits.length ? hits : commandlist, line];
  }

  console.log("hello, friend");
  console.log(`connecting to ${_params.redis}`);

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
    const datapointColor = config.watch[data.id.toString()] || "default";
    if (typeof colors[datapointColor] === "function") {
      return colors[datapointColor](strValue);
    }

    return strValue;
  };

  // only difference is that this function hides datapoints
  const formatCastedDatapointValue = data => {
    const datapointColor = config.watch[data.id.toString()];
    // hidden datapoint support
    if (datapointColor === "hide" || datapointColor === "hidden") {
      return null;
    }

    // show as usual
    return formatDatapointValue(data);
  };

  const formatDatapointDescription = t => {
    let valid = JSON.parse(t.valid);
    if (!valid) {
      return null;
    }
    let res = `#${t.id}: length = ${t.length}, `;
    res += `dpt = ${t.dpt}, prio: ${t.flag_priority}, `;
    res += `flags: [`;
    res += JSON.parse(t.flag_communication) ? "C" : "-";
    res += JSON.parse(t.flag_read) ? "R" : "-";
    res += JSON.parse(t.flag_write) ? "W" : "-";
    res += JSON.parse(t.flag_transmit) ? "T" : "-";
    res += JSON.parse(t.flag_update) ? "U" : "-";
    res += `]`;

    return res;
  };

  // register datapoint value listener
  bobaos.on("datapoint value", payload => {
    // if multiple values
    if (Array.isArray(payload)) {
      payload.map(formatCastedDatapointValue).forEach(console_out);

      return;
    }

    console_out(formatCastedDatapointValue(payload));
  });

  bobaos.on("server item", payload => {
    let { id, value, raw } = payload;
    console_out(`Server item indication: id = ${id}, value = ${value}, raw = ${raw}`);
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
          if (Array.isArray(res)) {
            res.forEach(t => {
              console_out(formatDatapointValue(t));
            });
          } else {
            console_out(formatDatapointValue(res));
          }
          break;
        case "stored":
          res = await bobaos.getStoredValue(args);
          if (Array.isArray(res)) {
            res.forEach(t => {
              console_out(formatDatapointValue(t));
            });
          } else {
            console_out(formatDatapointValue(res));
          }
          break;
        case "read":
          res = await bobaos.readValue(args);
          break;
        case "description":
          if (args === "*") {
            args = null;
          }
          res = await bobaos.getDescription(args);
          res
            .map(formatDatapointDescription)
            .filter(t => t)
            .forEach(console_out);
          break;
        case "getbyte":
          res = await bobaos.getParameterByte(args);
          console_out(res);
          break;
        case "watch":
          args.forEach(a => {
            let { id, color } = a;
            config.watch[id.toString()] = color;
            console_out(`datapoint ${id} value is now in ${color}`);
          });
          break;
        case "unwatch":
          args.forEach(id => {
            if (Object.prototype.hasOwnProperty.call(config.watch, id.toString())) {
              delete config.watch[id.toString()];
              console_out(`datapoint ${id} value is now in default color`);
            }
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
          // setTimeout(async _ => {
          res = await bobaos.getProgrammingMode();
          console_out(`BAOS module in programming mode: ${JSON.stringify(res.value[0])}`);
          // }, 100);
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
          console_out(`::> watch ( 1: red | [1: red, 2: green, 3: underline, 4: hide, 5: hidden] ) `);
          console_out(`::  unwatch ( 1 2 3 | [1, 2, 3] )`);
          console_out(` `);
          console_out(`:: BAOS services: `);
          console_out(`::> getbyte ( 1 2 3 | [1, 2, 3] ) `);
          console_out(`::  getitem ( * | 1 2...17 | [1, 2, .., 17] ) `);
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
    configFile.write(config);
    process.exit(0);
  });
};

module.exports = App;
