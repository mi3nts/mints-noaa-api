/*
    queries.js
    MINTS-BACKEND
    
    Queries data from postgre
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
    Get entire table data based on url
*/
const getSensorData = (request, response) => {
    // Request URL will have the "/" at the beginning so it must be dealt with
    var getQuery
    switch(request.url.substr(1)) {
        case "data_pm1":
            getQuery = "SELECT * FROM data_pm1 ORDER BY timestamp DESC"
            break;
        case "data_pm2_5":
            getQuery = "SELECT * FROM data_pm2_5 ORDER BY timestamp DESC"
            break;
        case "data_pm10":
            getQuery = "SELECT * FROM data_pm10 ORDER BY timestamp DESC"
            break;
    }
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        }
        // Display JSON data 
        else response.status(200).json(results.rows)
    })
}

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
    const getQuery = "SELECT sensor_id FROM sensor_meta WHERE allow_public = true ORDER BY last_updated;"
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

/*
    Get the time range of sensor data for a specific sensor
*/
const getSensorDataRangeForID = (request, response) => {
    var dataInterval = ""
    if(request.params.interval) {
        var year = 1, month = 1, day = 1
        var hour = 1, minute = 1, second = 1
        var intervalParts = request.params.interval.split(" ")
        if(intervalParts.length == 1) {
            if(intervalParts[0].includes(":")) {
                var intervalTimeParts = intervalParts[0].split(":")
                if(intervalTimeParts.length == 3) {
                    hour = (Number(intervalTimeParts[0]) == 0 ? 1 : Number(intervalTimeParts[0]))
                    minute = (Number(intervalTimeParts[1]) == 0 ? 1 : Number(intervalTimeParts[1]))
                    second = (Number(intervalTimeParts[2]) == 0 ? 1 : Number(intervalTimeParts[2]))
                } else if(intervalTimeParts.length == 2) {
                    minute = (Number(intervalTimeParts[0]) == 0 ? 1 : Number(intervalTimeParts[0]))
                    second = (Number(intervalTimeParts[1]) == 0 ? 1 : Number(intervalTimeParts[1]))
                } else {
                    second = (Number(intervalTimeParts[0]) == 0 ? 1 : Number(intervalTimeParts[0]))
                }
            } else {
                var intervalDateParts = intervalParts[0].split("-")
                if(intervalDateParts.length == 3) {
                    year = (Number(intervalDateParts[0]) == 0 ? 1 : Number(intervalDateParts[0]))
                    month = (Number(intervalDateParts[1]) == 0 ? 1 : Number(intervalDateParts[1]))
                    day = (Number(intervalDateParts[2]) == 0 ? 1 : Number(intervalDateParts[2]))
                } else if(intervalDateParts.length == 2) {
                    month = (Number(intervalDateParts[0]) == 0 ? 1 : Number(intervalDateParts[0]))
                    day = (Number(intervalDateParts[1]) == 0 ? 1 : Number(intervalDateParts[1]))
                } else {
                    day = (Number(intervalDateParts[0]) == 0 ? 1 : Number(intervalDateParts[0]))
                }
            }
        }
        if(intervalParts.length == 2) {
            var intervalTimeParts = intervalParts[1].split(":")
            if(intervalTimeParts.length == 3) {
                hour = (Number(intervalTimeParts[0]) == 0 ? 1 : Number(intervalTimeParts[0]))
                minute = (Number(intervalTimeParts[1]) == 0 ? 1 : Number(intervalTimeParts[1]))
                second = (Number(intervalTimeParts[2]) == 0 ? 1 : Number(intervalTimeParts[2]))
            } else if(intervalTimeParts.length == 2) {
                minute = (Number(intervalTimeParts[0]) == 0 ? 1 : Number(intervalTimeParts[0]))
                second = (Number(intervalTimeParts[1]) == 0 ? 1 : Number(intervalTimeParts[1]))
            } else {
                second = (Number(intervalTimeParts[0]) == 0 ? 1 : Number(intervalTimeParts[0]))
            }
        }
        
        dataInterval = 
          "mod(extract(year from data_pm1.timestamp)::INT, " + year + ") = 0 AND " +
          "mod(extract(month from data_pm1.timestamp)::INT, " + month + ") = 0 AND " +
          "mod(extract(day from data_pm1.timestamp)::INT, " + day + ") = 0 AND " +
          "mod(extract(hour from data_pm1.timestamp)::INT, " + hour + ") = 0 AND " +
          "mod(extract(minute from data_pm1.timestamp)::INT, " + minute + ") = 0 AND " + 
          "mod(extract(second from data_pm1.timestamp)::INT, " + second + ") = 0 AND "
    }
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
        "WHERE " + dataInterval + 
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
/*const getSensorDataRangeExportCSVForID = (request, response) => {
    const getQuery = "COPY (SELECT " +
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
        "ORDER BY data_pm1.timestamp ASC;) "
    const getQueryParams = [request.params.start_date, request.params.end_date, request.params.sensor_id]
    psql.query(getQuery, getQueryParams, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}*/

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    getSensorData,
    getLatestSensorData,
    getListOfSensorIDs,
    getLatestSensorDataForID,
    getSensorDataRangeForID,
    getSensorLocations,
    getSensorLocationForID,
    getSensorNameForID
}
