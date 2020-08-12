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

module.exports = {
    getAllDataFromDatabase,
    getLatestDataFromDatabase,
    getDataByRecordedTime
}