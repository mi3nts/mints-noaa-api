/*
    queries.js
    MINTS-BACKEND
    
    Queries data from postgreSQL and provides .json output
    (Data-version)
*/
const pg = require('pg')
pg.types.setTypeParser(1114, str => str);

const PSQL = require('pg').Pool
const pgcon = require('../postgrescon.js')

// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})

/*
    Get the latest sensor data out of all sensors
*/
const getLatestSensorData = (request, response) => {
    const getQuery = "SELECT " +
            "data_pm1.timestamp, " +
            "data_pm1.sensor_id, " +
            "data_pm1.value as pm1, " +
            "data_pm2_5.value as pm2_5, " +
            "data_pm10.value as pm10, " +
            "data_pm1.temperature, " +
            "data_pm1.humidity, " +
            "data_pm1.longitude, " +
            "data_pm1.latitude " +
        "FROM data_pm1 " +
        "INNER JOIN data_pm2_5 ON data_pm2_5.timestamp = data_pm1.timestamp AND data_pm2_5.sensor_id = data_pm1.sensor_id " +
        "INNER JOIN data_pm10 ON data_pm10.timestamp = data_pm1.timestamp AND data_pm10.sensor_id = data_pm1.sensor_id " +
        "WHERE data_pm1.timestamp = (SELECT MAX(timestamp) FROM data_pm1)"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

/*
    Get the list of sensor IDs
*/
const getListOfSensorIDs = (request, response) => {
    const getQuery = "SELECT sensor_id FROM sensor_meta WHERE allow_public = true AND " + 
        "(last_updated BETWEEN now() - interval '4 hours' AND now())" + 
        "ORDER BY last_updated;"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else {
            var buffer = []
            for(var i = 0; i < results.rows.length; i++) {
                buffer.push(results.rows[i]['sensor_id'])
            }
            response.status(200).json(buffer)
        }
    })
}

/*
    Get the latest sensor data for a specific sensor
*/
const getLatestSensorDataForID = (request, response) => {
    const getQuery = "SELECT " +
            "data_pm1.timestamp, " +
            "data_pm1.sensor_id, " +
            "data_pm1.value as pm1, " +
            "data_pm2_5.value as pm2_5, " +
            "data_pm10.value as pm10, " +
            "data_pm1.temperature, " +
            "data_pm1.humidity, " +
            "data_pm1.longitude, " +
            "data_pm1.latitude " +
        "FROM data_pm1 " +
        "INNER JOIN data_pm2_5 ON data_pm2_5.timestamp = data_pm1.timestamp AND data_pm2_5.sensor_id = data_pm1.sensor_id " +
        "INNER JOIN data_pm10 ON data_pm10.timestamp = data_pm1.timestamp AND data_pm10.sensor_id = data_pm1.sensor_id " +
        "WHERE data_pm1.timestamp = (SELECT MAX(timestamp) FROM data_pm1 WHERE sensor_id = $1)" +
        "AND data_pm1.sensor_id = $1;"
    const getQueryParams = [request.params.sensor_id]
    psql.query(getQuery, getQueryParams, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

const getDataByTypeLatestForID = (request, response) => {
    var dataType = request.params.type
    if(dataType != 'pm1' && dataType != 'pm2_5' && dataType != 'pm10') {
        response.json({
            status: 500,
            error: "Invalid data type specified"
        })
    } else {
        const getQuery = "SELECT timestamp, value as " + dataType + " FROM data_" + dataType + " " +
            "WHERE sensor_id = $1 AND timestamp = (SELECT MAX(timestamp) FROM data_" + dataType + " WHERE sensor_id = $1)" +
            "ORDER BY timestamp ASC;"
        const getQueryParams = [request.params.sensor_id]
        psql.query(getQuery, getQueryParams, (error, results) => {
            if(error) {
                response.json({
                    status: 500,
                    error: error.message
                })
            } else response.status(200).json(results.rows)
        })
    }
}

/*
    Get the time range of sensor data for a specific sensor
*/
const getSensorDataRangeForID = (request, response) => {
    const getQuery = "SELECT " +
            "data_pm1.timestamp, " +
            "data_pm1.sensor_id, " +
            "data_pm1.value as pm1, " +
            "data_pm2_5.value as pm2_5, " +
            "data_pm10.value as pm10, " +
            "data_pm1.temperature, " +
            "data_pm1.humidity, " +
            "data_pm1.longitude, " +
            "data_pm1.latitude " +
        "FROM data_pm1 " +
        "INNER JOIN data_pm2_5 ON data_pm2_5.timestamp = data_pm1.timestamp AND data_pm2_5.sensor_id = data_pm1.sensor_id " +
        "INNER JOIN data_pm10 ON data_pm10.timestamp = data_pm1.timestamp AND data_pm10.sensor_id = data_pm1.sensor_id " +
        "WHERE " +
        "data_pm1.timestamp >= $1 AND data_pm1.timestamp <= $2 " +
        "AND data_pm1.sensor_id = $3 " +
        "ORDER BY data_pm1.timestamp ASC;"
    const getQueryParams = [request.params.start_date, request.params.end_date, request.params.sensor_id]
    psql.query(getQuery, getQueryParams, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

const getRangeDataByTypeBySensorID = (request, response) => {
    var dataType = request.params.type
    if(dataType != 'pm1' && dataType != 'pm2_5' && dataType != 'pm10') {
        response.json({
            status: 500,
            error: "Invalid data type specified"
        })
    } else {
        const getQuery = "SELECT timestamp, value as " + dataType + " FROM data_" + dataType + " " +
            "WHERE sensor_id = $3 AND timestamp >= $1 AND timestamp <= $2 " +
            "ORDER BY timestamp ASC;"
        const getQueryParams = [request.params.start_date, request.params.end_date, request.params.sensor_id]
        psql.query(getQuery, getQueryParams, (error, results) => {
            if(error) {
                response.json({
                    status: 500,
                    error: error.message
                })
            } else response.status(200).json(results.rows)
        })
    }
}

const getSensorLocations = (request, response) => {
    const getQuery = "SELECT sensor_id, longitude, latitude, last_updated FROM sensor_meta;"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

const getSensorLocationForID = (request, response) => {
    const getQuery = "SELECT sensor_id, longitude, latitude, last_updated FROM sensor_meta WHERE sensor_id = $1;"
    const getQueryParams = [request.params.sensor_id]
    psql.query(getQuery, getQueryParams, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

const getSensorNameForID = (request, response) => {
    const getQuery = "SELECT sensor_name FROM sensor_meta WHERE sensor_id = $1;"
    const getQueryParams = [request.params.sensor_id]
    psql.query(getQuery, getQueryParams, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

const getExportCSVSensorDataRangeForID = (request, response) => {
    const getQuery = "SELECT " +
            "data_pm1.timestamp, " +
            "data_pm1.sensor_id, " +
            "data_pm1.value as pm1, " +
            "data_pm2_5.value as pm2_5, " +
            "data_pm10.value as pm10, " +
            "data_pm1.temperature, " +
            "data_pm1.humidity, " +
            "data_pm1.longitude, " +
            "data_pm1.latitude " +
        "FROM data_pm1 " +
        "INNER JOIN data_pm2_5 ON data_pm2_5.timestamp = data_pm1.timestamp AND data_pm2_5.sensor_id = data_pm1.sensor_id " +
        "INNER JOIN data_pm10 ON data_pm10.timestamp = data_pm1.timestamp AND data_pm10.sensor_id = data_pm1.sensor_id " +
        "WHERE data_pm1.timestamp >= $1 AND data_pm1.timestamp <= $2" +
        "AND data_pm1.sensor_id = $3" +
        "ORDER BY data_pm1.timestamp ASC;"
    const getQueryParams = [request.params.start_date, request.params.end_date, request.params.sensor_id]
    psql.query(getQuery, getQueryParams, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else {
            response.status(200).json(results.rows)
        }
    })
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    getLatestSensorData,
    getListOfSensorIDs,
    getLatestSensorDataForID,
    getDataByTypeLatestForID,
    getSensorDataRangeForID,
    getRangeDataByTypeBySensorID,
    getSensorLocations,
    getSensorLocationForID,
    getSensorNameForID
}
