const state = require('./state.js');
const sqlite = require('sqlite3').verbose();

const content = state.load();

let db = new sqlite.Database('./database.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('> [database-robot] Connected to the database.');
});

function createTable(){
    const sql = "CREATE TABLE `content` (rowid, `prefix` varchar(45) NOT NULL DEFAULT ':ABOUT:', `searchTerm` varchar(45) NOT NULL, `maximumSentences` varchar(45) NOT NULL DEFAULT '7', `voice` varchar(45) NOT NULL DEFAULT 'Paid', `videoDestination` varchar(45) NOT NULL DEFAULT 'YouTube', `language` varchar(45) NOT NULL DEFAULT 'PT')";
    db.run(sql);
}

function saveBaseData(content){
    const sql = ""
}

function closeConnection(){
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('> [database-robot] Close the database connection.');
    });
}

module.exports = {
    saveBaseData,
    closeConnection,
    createTable
};