// const Pool = require('pg').Pool
const pgcon = require('../postgrescon.js')

const PSQL = require('pg').Pool
const pool = new PSQL({
    connectionString: pgcon.PSQL_WIND_LOGIN
})

/* Table format:
 *  wind_data (
        recorded_time timestamp with time zone,
        header jsonb,
        data decimal[]
    );
 * 
 * Get all data from the PostgreSQL database
 */
const getAllDataFromDatabase = (request, response) => {
    pool.query('SELECT * FROM wind_data;', (error, results) => {
        if (error) {
            response.status(404).json({message: error}); 
            throw error;
        }
        response.status(200).json({count: results.rows.length, results: results.rows});
    });
}

/*
 * Get the latest available data from the PostgreSQL database
 */
const getLatestDataFromDatabase = (request, response) => {
    pool.query("SELECT * FROM wind_data WHERE recorded_time = (SELECT MAX(recorded_time) FROM wind_data)", (error, results) => {
        if (error) {
            response.status(404).json({message: error});
            throw error;
        }
        response.status(200).json(results.rows);
    });
}

const getDataByRecordedTime = (request, response) => {
    const recorded_time = request.params.recorded_time
  
    pool.query('SELECT * FROM wind_data WHERE recorded_time = $1', [recorded_time], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
}

const updateData = (request, response) => {
    var fs = require("fs");
    var content = String(fs.readFileSync("./data/wind_data.json"));

    parseFile = JSON.parse(content);
    recorded = parseFile[0]["recordedTime"];

    pool.query('DELETE from wind_data WHERE recorded_time = $1', [recorded], (error, results) => {
        if (error) {
            response.status(404).json({message: error});
            throw error;
        }
    });
    for(var i = 0; i < parseFile.length; i++) {
        header = parseFile[i]["header"];
        dataArray = parseFile[i]["data"];
        recordedTime = parseFile[i]["recordedTime"];
        pool.query("INSERT INTO wind_data VALUES ($1, $2, $3)", [recordedTime, header, dataArray], (error, results) => {
            if (error) {
                response.status(404).json({message: error}); 
                throw error;
            }

        });
    }
    response.status(200).json("UPDATE DATA STATUS : OK !");
}

/*
 * Get data from online source and store into PostgreSQL database
 */
const postDataFromSource = (request, response) => {
    var fs = require("fs");
    var content = String(fs.readFileSync("../wind/data/wind_data.json"));

    parseFile = JSON.parse(content);

    for(var i = 0; i < parseFile.length; i++) {
        header = parseFile[i]["header"];
        dataArray = parseFile[i]["data"];
        recordedTime = parseFile[i]["recordedTime"];

        pool.query("INSERT INTO wind_data VALUES ($1, $2, $3)", [recordedTime, header, dataArray], (error, results) => {
            if (error) {
                response.status(404).json({message: error}); 
                throw error;
            }

        });
    }
    response.status(200).json("POST DATA FROM SOURCE STATUS : OK !");
}

/*
 * To open up space, delete week old data from the PostgreSQL database
 */
const flushOldData = (request, response) => {
    pool.query("DELETE from wind_data WHERE recorded_time < now() - interval '7 days'"), (error, results) => {
        if (error) {
            response.status(404).json({message: error}); 
            throw error;
        }
    }
    response.status(200).json("FLUSH OLD DATA STATUS : OK !");
}

/*
 * Used only for testing purposes
 */
const flushAll = (request, response) => {
    pool.query("TRUNCATE wind_data;", (error, results) => {
        if (error) {
            response.status(404).json({message: error}); 
            throw error;
        }
        response.status(200).json(results.rows)
    });
}


module.exports = {
    getAllDataFromDatabase,
    getLatestDataFromDatabase,
    getDataByRecordedTime,
    updateData,
    postDataFromSource,
    flushOldData,
    flushAll
}