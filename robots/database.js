const state = require('./state.js');
const sqlite = require('sqlite3').verbose();

let content = {};

let db = new sqlite.Database('./database.db', (err) => {
    if (err) {
        return console.error("> [database-robot] " + err.message);
    }
    console.log('> [database-robot] Connected to the database.');
});


function createTable() {
    const sql = "CREATE TABLE `content` (" +
        "`id` INTEGER PRIMARY KEY AUTOINCREMENT," +
        " `prefix` varchar(45) NOT NULL DEFAULT ':ABOUT:', " +
        "`searchTerm` varchar(45) NOT NULL, " +
        "`maximumSentences` varchar(45) NOT NULL DEFAULT '7', " +
        "`voice` varchar(45) NOT NULL DEFAULT 'Paid', " +
        "`videoDestination` varchar(45) NOT NULL DEFAULT 'YouTube', " +
        "`language` varchar(45) NOT NULL DEFAULT 'PT')";
    db.run(sql);
}

function saveBaseData() {
    content = state.load();
    const sql = `INSERT INTO content(prefix, searchTerm, maximumSentences, voice, videoDestination, language) VALUES ('${content.prefix}', '${content.searchTerm}', '${content.maximumSentences}', '${content.voice}', '${content.videoDestination}', '${content.language}')`;
    console.log("> [database-robot] Saving Data");
    console.log(sql);
    db.run(sql);
    return console.log("> [database-robot] Data Saved");
}

function checkIfIdExistsInDatabase(id) {
    const sql = `SELECT count(*) AS bool FROM content WHERE id = ${id}`;
    db.each(sql, function (err, row) {
        if (err || row.bool === 0) {
            console.error(`> [database-robot] Error at loading data: Invalid ID`);
            if (id <= 1) {
                console.log("tchau")
                process.exit(1);
            } else {
                console.log(`> [database-robot] Searching by ID = ${id - 1}`);
                checkIfIdExistsInDatabase(id - 1);
            }
        } else {
            return true;
        }
    });
}

function loadById(id) {
    if (checkIfIdExistsInDatabase(id)) {
    console.log("oi")
        const sql = `SELECT * FROM content WHERE id = ${id}`;
        db.each(sql, function (err, row) {
            if (err) {
                console.error("> [database-robot] Error at loading data " + err);
                process.exit(1);
            }

            content.prefix = row.prefix;
            content.searchTerm = row.searchTerm;
            content.maximumSentences = row.maximumSentences;
            content.voice = row.voice;
            content.videoDestination = row.videoDestination;
            content.language = row.language;

            state.save(content);

            console.log(row);
            console.log(`> [database-robot] Data loaded from Database`);
        });
    }
}

function deleteById(id) {
    const sql = `DELETE from content where id = ${id}`
    db.run(sql);
    console.log(`> [database-robot] ID ${id} deleted from Database`);

}

function closeConnection() {
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
    createTable,
    loadById
};