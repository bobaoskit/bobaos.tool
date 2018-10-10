const fs = require("fs");
const readline = require("readline");

const { Grammars } = require("ebnf");

// init parser
const grammar = fs.readFileSync("./grammar", "utf8");
const parser = new Grammars.W3C.Parser(grammar);

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

const processUIntListArgs = list => {
  return list.map(a => parseInt(a.text, 10));
};

const processUIntListCmd = (cmdType, cmdArgs) => {
  let res = {
    command: cmdType,
    args: []
  };
  res.args = processUIntListArgs(cmdArgs.children);

  return res;
};

const processValueObject = valueObj => {
  let res = null;
  if (valueObj.type === "Number") {
    res = JSON.parse(valueObj.text);
  }
  if (valueObj.type === "Bool") {
    res = JSON.parse(valueObj.text);
  }
  if (valueObj.type === "Null") {
    res = null;
  }
  if (valueObj.type === "String") {
    res = valueObj.text.trim();
  }
  if (valueObj.type === "Identifier") {
    res = valueObj.text.trim();
  }

  return res;
};

const processDatapointValue = cmdArgs => {
  const findUInt = t => t.type === "uint";
  const id = parseInt(cmdArgs.find(findUInt).text, 10);
  const findValue = t => t.type === "Value";
  const valueObj = cmdArgs.find(findValue).children[0];
  const value = processValueObject(valueObj);

  return { id: id, value: value };
};

const processDatapointValueArray = cmdArgs => {
  return cmdArgs.map(t => {
    return processDatapointValue(t.children);
  });
};

const processSetCmd = cmdArgs => {
  let res = {
    command: "set",
    args: []
  };
  switch (cmdArgs.type) {
    case "DatapointValue":
      res.args.push(processDatapointValue(cmdArgs.children));
      break;
    case "DatapointValueArray":
      res.args = processDatapointValueArray(cmdArgs.children);
      break;
    default:
      break;
  }

  return res;
};

const processDescriptionCmd = cmdArgs => {
  let res = {
    command: "description",
    args: null
  };
  console_out(cmdArgs.type);
  if (cmdArgs.type === "Asterisk") {
    res.args = "*";
  }
  if (cmdArgs.type === "UIntList" || cmdArgs.type === "UIntArray") {
    res.args = processUIntListArgs(cmdArgs.children);
  }

  return res;
};

const processProgMode = cmdArgs => {
  let res = {
    command: "progmode",
    args: null
  };
  if (cmdArgs.type === "Value") {
    let valueArg = cmdArgs.children[0];
    if (valueArg.type === "Number") {
      res.args = Boolean(parseInt(valueArg.text, 10));
    }
    if (valueArg.type === "Bool") {
      res.args = JSON.parse(valueArg.text);
    }
  }
  if (cmdArgs.type === "Question") {
    res.args = "?";
  }

  return res;
};

const processWatchArg = cmdArg => {
  const findUInt = t => t.type === "uint";
  const id = parseInt(cmdArg.children.find(findUInt).text, 10);
  const findColor = t => {
    return t.type === "Identifier" || t.type === "String";
  };
  const color = cmdArg.children.find(findColor).text;

  return { id: id, color: color };
};

const processWatchCmd = cmdArgs => {
  let res = {
    command: "watch",
    args: []
  };

  if (cmdArgs.type === "WatchCmdArg") {
    res.args.push(processWatchArg(cmdArgs));
  }
  if (cmdArgs.type === "WatchCmdArgArray") {
    res.args = cmdArgs.children.map(processWatchArg);
  }

  return res;
};

const processIdentifierArgs = list => {
  return list.map(a => a.text.trim());
};

const processItemCmd = cmdArgs => {
  let res = {
    command: "item",
    args: []
  };

  if (cmdArgs.type === "Asterisk") {
    res.args = "*";
  }

  if (cmdArgs.type === "IdentifierList" || cmdArgs.type === "IndentifierArray") {
    res.args = processIdentifierArgs(cmdArgs.children);
  }

  return res;
};

const processCmd = cmd => {
  let cmdType = cmd.type;
  let cmdArgs = cmd.children[0];
  switch (cmdType) {
    case "get":
      return processUIntListCmd(cmdType, cmdArgs);
    case "stored":
      return processUIntListCmd(cmdType, cmdArgs);
    case "read":
      return processUIntListCmd(cmdType, cmdArgs);
    case "getbyte":
      return processUIntListCmd(cmdType, cmdArgs);
    case "set":
      return processSetCmd(cmdArgs);
    case "ping":
      return { command: "ping" };
    case "state":
      return { command: "state" };
    case "reset":
      return { command: "reset" };
    case "progmode":
      return processProgMode(cmdArgs);
    case "description":
      return processDescriptionCmd(cmdArgs);
    case "watch":
      return processWatchCmd(cmdArgs);
    case "item":
      return processItemCmd(cmdArgs);
    default:
      break;
  }
};

rl.on("line", line => {
  try {
    let res = parser.getAST(line.trim());
    if (res.type === "command") {
      let cmdObject = res.children[0];
      let command = processCmd(cmdObject);
      console_out(command);
    }
  } catch (e) {
    console_out(e.message);
  }
  rl.prompt(true);
}).on("close", () => {
  console.log("Have a great day, friend!");
  process.exit(0);
});