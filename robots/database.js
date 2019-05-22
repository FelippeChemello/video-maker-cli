const state = require('./state.js');
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'mysql.lightcode.dev',
    user: 'lightcode',
    password: 'fc251199',
    database: 'lightcode'
});

function robot(option) {

    console.log('> [database-robot] Starting...');
    const content = state.load();

    switch (option) {
        case "saveBaseData":
            saveBaseData();
            break;
        case "loadById":
            loadById(content.loadId);
            break;
        default:
            console.log("> [database-robot] Database selection error");
    }

    function saveBaseData() {
        console.log("> [database-robot] Saving data in database");
        connection.connect(function (err) {
            if (err) {
                return console.log("> [database-robot] error in establishing database connection");
            } else {
                const sql = "INSERT INTO `content` VALUES ?";
                const values = [[
                    "default",
                    content.prefix,
                    content.searchTerm,
                    content.maximumSentences,
                    content.voice,
                    content.videoDestination,
                    content.language
                ]]

                connection.query(sql, [values], function (error, results, fields) {
                    if (error) {
                        return console.log("> [database-robot] error in database query " + error);
                    } else {
                        console.log("> [database-robot] data saved successfully");
                        connection.end();
                    }
                });
            }
        });
    }

    function loadById(id) {
        console.log("> [database-robot] Loading data from " + id + " id");
        connection.connect(function (err) {
            if (err) {
                return console.log("> [database-robot] error in establishing database connection");
            } else {
                connection.query("SELECT * FROM content WHERE id = ?", id, function (error, results, fields) {
                    if (error) {
                        return console.log("> [database-robot] error in database query " + error);
                    } else {
                        if(results[0]) {
                            content.prefix = results[0].prefix;
                            content.searchTerm = results[0].searchTerm;
                            content.maximumSentences = results[0].maximumSentences;
                            content.voice = results[0].voice;
                            content.videoDestination = results[0].videoDestination;
                            content.language = results[0].language;
                            state.save(content);
                        }else{
                            console.log("> [database-robot] Invalid ID");
                        }
                        connection.end();
                    }
                });
            }
        });
    }

}

module.exports = robot;