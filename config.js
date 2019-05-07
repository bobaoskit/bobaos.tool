const fs = require("fs");
const os = require("os");

// default
const config = {};
config.watch = {};

// try to read user config
// if error, then create directory ~/.config/bobaos
// and write pub.json file
const cfgdir = `${os.homedir()}/.config/bobaos`;
const cfgpath = `${cfgdir}/tool.json`;

try {
  const user = JSON.parse(fs.readFileSync(cfgpath, "utf8"));
  Object.assign(config, user);
} catch (e) {
  if (e.code === "ENOENT") {
    console.log("User config file does not exist");
    try {
      fs.mkdirSync(cfgdir, { recursive: true });
    } catch (e) {
      if (e.code !== "EEXIST") {
        throw e;
      }
    }

    // write default config
    const configString = JSON.stringify(config, null, 2);
    fs.writeFileSync(cfgpath, configString, "utf8");
    console.log("Default congig file created at");
    console.log(cfgpath);
  } else {
    // unknown error
    throw e;
  }
}

const getConfig = _ => {
  return config;
};

const writeConfig = config => {
  const configString = JSON.stringify(config, null, 2);
  fs.writeFileSync(cfgpath, configString, "utf8");
};

module.exports = {
  get: getConfig,
  write: writeConfig
};
