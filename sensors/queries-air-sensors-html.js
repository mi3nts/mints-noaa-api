/*
    queries-air-sensors-html.js
    MINTS-BACKEND
    
    Queries data from database and provides HTML output
    (Browser-Version)
*/
const pg = require('pg')
pg.types.setTypeParser(1114, str => str);

const PSQL = require('pg').Pool
const pgcon = require('../postgrescon.js')

// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})


const getSensorStatus = (request, response) => {
    const getQuery = "SELECT sensor_id, sensor_name, last_updated FROM sensor_meta ORDER BY last_updated DESC"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else {
            var htmlbuffer = '<head>' +
                '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">' + 
                '</head>'
            htmlbuffer += "<table class='table'><thead><tr>" +
                "<th scope='col'> Last Updated </th>" +
                "<th scope='col'> Sensor ID </th>" +
                "<th scope='col'> Sensor Name </th>" +
                "</tr></thead><tbody>"
            for(var i = 0; i < results.rows.length; i++) {
                htmlbuffer += "<tr>" +
                    "<td>" + results.rows[i].last_updated + "</td>" + 
                    "<td>" + results.rows[i].sensor_id + "</td>" +
                    "<td>" + results.rows[i].sensor_name + "</td>" +
                    "</tr>"
            }
            htmlbuffer += "</tbody></table>"
            response.status(200).send(htmlbuffer)
        }
    })
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
        "data_pm1.pressure, " + 
        "data_pm1.dewpoint, " + 
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
            console.log(error.stack)
        } else {
            var htmlRes = '<head>' +
            '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">' + 
            '</head>'
            htmlRes += "<table class='table table-sm table-bordered table-striped'><thead><tr>" +
                "<th scope='col'> Timestamp (UTC) </th>" +
                "<th scope='col'> Sensor ID </th>" +
                "<th scope='col'> PM 1 </th>" +
                "<th scope='col'> PM 2.5 </th>" +
                "<th scope='col'> PM 10 </th>" +
                "<th scope='col'> Temperature </th>" +
                "<th scope='col'> Humidity </th>" +
                "<th scope='col'> Pressure </th>" +
                "<th scope='col'> Dew Point </th>" +
                "<th scope='col'> Longitude </th>" +
                "<th scope='col'> Latitude </th>" +
                "</tr></thead><tbody>"
            for(var i = 0; i < results.rows.length; i++) {
                htmlRes += "<tr>" +
                    "<td>" + results.rows[i].timestamp + "</td>" + 
                    "<td>" + results.rows[i].sensor_id + "</td>" +
                    "<td>" + results.rows[i].pm1 + "</td>" +
                    "<td>" + results.rows[i].pm2_5 + "</td>" +
                    "<td>" + results.rows[i].pm10 + "</td>" +
                    "<td>" + results.rows[i].temperature + "</td>" +
                    "<td>" + results.rows[i].humidity + "</td>" +
                    "<td>" + results.rows[i].pressure + "</td>" +
                    "<td>" + results.rows[i].dewpoint + "</td>" +
                    "<td>" + results.rows[i].longitude + "</td>" +
                    "<td>" + results.rows[i].latitude + "</td>" +
                    "</tr>"
            }
            htmlRes += "</tbody></table>"
            response.status(200).send(htmlRes)
        }
    })
}

module.exports = {
    getSensorStatus,
    getSensorDataRangeForID
}