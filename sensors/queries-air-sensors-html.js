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
    const getQuery = "SELECT sensor_id, sensor_name, last_updated FROM sensor_meta ORDER BY last_updated DESC;"
    // Callback function is async due to asynchronous operations being made
    psql.query(getQuery, async (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else {
            var htmlbuffer = '<head>' +
                '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">' + 
                '</head>'
            htmlbuffer += "<table class='table table-sm'><thead><tr>" +
                "<th scope='col'> Last Updated </th>" +
                "<th scope='col'> Sensor ID </th>" +
                "<th scope='col'> Sensor Name </th>" +
                "<th scope='col'> Timestamp </th>" +
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
                last_updated = results.rows[i].last_updated
                rowColor = ""
                last_updated_date = Date.parse(last_updated)
                now = (new Date()).getTime()
                if(now - last_updated_date > 1209600000) {      // 2 weeks
                    rowColor = "table-secondary"
                } else if(now - last_updated_date > 86400000) { // 24 hours
                    rowColor = "table-danger"
                } else if(now - last_updated_date > 3600000) {  // 1 hour
                    rowColor = "table-warning"
                }
                sensor_id = results.rows[i].sensor_id
                htmlbuffer += "<tr class=\"" + rowColor + "\">" +
                    "<td>" + last_updated + "</td>" + 
                    "<td>" + sensor_id + "</td>" +
                    "<td>" + results.rows[i].sensor_name + "</td>"
                // Await is needed here because of a promise inside the function
                let dataBuffer = await getLatestSensorDataForID(sensor_id)
                htmlbuffer += dataBuffer + "</tr>"
            }
            htmlbuffer += "</tbody></table>"
            response.status(200).send(htmlbuffer)
        }
    })
}

// Function must be async as there are async calls made with PSQL queries
async function getLatestSensorDataForID(sensor_id) {
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
        "WHERE data_pm1.timestamp = (SELECT MAX(timestamp) FROM data_pm1 WHERE sensor_id = $1)" +
        "AND data_pm1.sensor_id = $1;"
    const getQueryParams = [sensor_id]
    var htmlRes = ""
    // Await promise to be fulfilled
    let results = await psql.query(getQuery, getQueryParams)
    for(var i = 0; i < results.rows.length; i++) {
        htmlRes += 
            "<td>" + results.rows[i].timestamp + "</td>" + 
            "<td>" + results.rows[i].pm1 + "</td>" +
            "<td>" + results.rows[i].pm2_5 + "</td>" +
            "<td>" + results.rows[i].pm10 + "</td>" +
            "<td>" + results.rows[i].temperature + "</td>" +
            "<td>" + results.rows[i].humidity + "</td>" +
            "<td>" + results.rows[i].pressure + "</td>" +
            "<td>" + results.rows[i].dewpoint + "</td>" +
            "<td>" + results.rows[i].longitude + "</td>" +
            "<td>" + results.rows[i].latitude + "</td>"
    }
    if(htmlRes == "") {
        htmlRes += 
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>" +
            "<td> N/A </td>"
    }
    return htmlRes
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
                pm2_5 = results.rows[i].pm2_5
                cellColor = "#ebde34"
                if(pm2_5 > 100) {
                    cellColor = "#aa2626"
                } else if(pm2_5 > 50) {
                    cellColor = "#990099"
                } else if(pm2_5 > 20) {
                    cellColor = "#cc0000"
                } else if(pm2_5 > 10) {
                    cellColor = "#ff5500"
                }
                htmlRes += "<tr>" +
                    "<td>" + results.rows[i].timestamp + "</td>" + 
                    "<td>" + results.rows[i].sensor_id + "</td>" +
                    "<td>" + results.rows[i].pm1 + "</td>" +
                    "<td style=\"background-color:" + cellColor + "\">" + pm2_5 + "</td>" +
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