const rimraf = require("rimraf");
const fs = require("fs");

async function robot() {
    rimraf.sync("./content");
    fs.mkdirSync("./content");
    console.log("> [start-robot] Directory CONTENT cleaned");
}

module.exports = robot;