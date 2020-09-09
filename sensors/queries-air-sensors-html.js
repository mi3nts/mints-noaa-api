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
    // Initial data query from the sensor metadata table
    const getQuery = "SELECT sensor_id, sensor_name, last_updated FROM sensor_meta ORDER BY last_updated DESC;"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else {
            // Second data query for latest data for all sensor ids
            const getQueryLatestData = "SELECT DISTINCT ON (data_pm1.sensor_id) " +
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
            "ORDER BY sensor_id, timestamp DESC;"
            psql.query(getQueryLatestData, (error, latestData) => {
                if(error) {
                    response.json({
                        status: 500,
                        error: error.message
                    })
                } else {
                    // Save latest data query into a variable so it can be used again
                    var data = latestData
                    
                    // Add formatting style link/library resources for bootstrap
                    var htmlbuffer = '<head>' +
                    '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">' + 
                    '</head>'

                    // Add navbar legend
                    htmlbuffer += "<nav class=\"navbar sticky-top navbar-expand-lg navbar-light bg-light\">" + 
                        "<a class=\"navbar-brand\" href=\"#\">MINTS Sensor Status</a>" +
                        "<button class=\"navbar-toggler\" type=\"button\" data-toggle=\"collapse\" data-target=\"#navbarNavAltMarkup\" aria-controls=\"navbarNavAltMarkup\" aria-expanded=\"false\" aria-label=\"Toggle navigation\">" +
                        "<span class=\"navbar-toggler-icon\"></span>" +
                        "</button>" +
                        "<div class=\"collapse navbar-collapse\" id=\"navbarNavAltMarkup\">" +
                        "<div class=\"navbar-nav\">" + 
                            "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\">Row color indicates sensor has not updated in: </a>" +
                            "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: yellow; border-radius: 50%; display:inline-block;\"></span> over 1 hour</a>" +
                            "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: red; border-radius: 50%; display:inline-block;\"></span> over 24 hours</a>" +
                            "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: gray; border-radius: 50%; display:inline-block;\"></span> over 2 weeks</a>" +
                        "</div>" +
                        "</div></nav>"

                    // Add table header
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

                        // Determine row color based on time since last update
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

                        // Search for data related to the currently selected sensor id
                        sensor_id = results.rows[i].sensor_id
                        htmlDataBuffer = ""
                        for(var j = 0; j < data.rows.length; j++) {
                            if(sensor_id == data.rows[j].sensor_id) {
                                htmlDataBuffer += 
                                    "<td>" + data.rows[j].timestamp + "</td>" + 
                                    "<td>" + data.rows[j].pm1 + "</td>" +
                                    "<td>" + data.rows[j].pm2_5 + "</td>" +
                                    "<td>" + data.rows[j].pm10 + "</td>" +
                                    "<td>" + data.rows[j].temperature + "</td>" +
                                    "<td>" + data.rows[j].humidity + "</td>" +
                                    "<td>" + data.rows[j].pressure + "</td>" +
                                    "<td>" + data.rows[j].dewpoint + "</td>" +
                                    "<td>" + data.rows[j].longitude + "</td>" +
                                    "<td>" + data.rows[j].latitude + "</td>"
                            }
                        }

                        // Data columns are marked N/A if no data is found
                        if(htmlDataBuffer == "") {
                            htmlDataBuffer += 
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

                        // Add information html buffer
                        htmlbuffer += "<tr class=\"" + rowColor + "\">" +
                            "<td>" + last_updated + "</td>" + 
                            "<td>" + sensor_id + "</td>" +
                            "<td>" + results.rows[i].sensor_name + "</td>"
                        htmlbuffer += htmlDataBuffer + "</tr>"
                    }
                    htmlbuffer += "</tbody><caption>As of " + (new Date()) + "</caption></table>"
                    response.status(200).send(htmlbuffer)
                }
            })
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
            // Add formatting style link/library resources for bootstrap
            var htmlRes = '<head>' +
            '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">' + 
            '<script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>' +
            '<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>' +
            '<script src="https://unpkg.com/floatthead"></script>' +
            '<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js" integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>' +
            '</head>'

            // Add navbar legend
            htmlRes += "<nav class=\"navbar sticky-top navbar-expand-lg navbar-light bg-light\">" + 
            "<a class=\"navbar-brand\" href=\"#\">MINTS Sensor Data</a>" +
            "<button class=\"navbar-toggler\" type=\"button\" data-toggle=\"collapse\" data-target=\"#navbarNavAltMarkup\" aria-controls=\"navbarNavAltMarkup\" aria-expanded=\"false\" aria-label=\"Toggle navigation\">" +
            "<span class=\"navbar-toggler-icon\"></span>" +
            "</button>" +
            "<div class=\"collapse navbar-collapse\" id=\"navbarNavAltMarkup\">" +
            "<div class=\"navbar-nav\">" + 
                "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\">PM 2.5 Color Range: </a>" +
                "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: rgb(255, 255, 68); border-radius: 50%; display:inline-block;\"></span> 0-10µg/m³</a>" +
                "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: rgb(255, 85, 0); border-radius: 50%; display:inline-block;\"></span> 10-20µg/m³</a>" +
                "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: rgb(204, 0, 0); border-radius: 50%; display:inline-block;\"></span> 20-50µg/m³</a>" +
                "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: rgb(153, 0, 153); border-radius: 50%; display:inline-block;\"></span> 50-100µg/m³</a>" +
                "<a class=\"nav-link disabled\" href=\"#\" style=\"color: black;\"><span style=\"height: 10px; width: 10px; background-color: rgb(170, 38, 38); border-radius: 50%; display:inline-block;\"></span> 100+µg/m³</a>" +
            "</div>" +
            "</div></nav>"

            // Add table column headings
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
            htmlRes += "</tbody><caption>Report generated on " + (new Date()) + "</caption></table>"
            response.status(200).send(htmlRes)
        }
    })
}

module.exports = {
    getSensorStatus,
    getSensorDataRangeForID
}