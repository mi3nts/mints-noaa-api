const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()
const port = 3000
const wind_db = require('./wind/wind-queries')
const sensor_db = require('./sensors/queries-air-sensors.js')
const sensor_html = require('./sensors/queries-air-sensors-html.js')

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Base request
app.get('/', (request, response) => {
    response.json({info: 'MINTS Data API. To see a list of available REST URLs, go to /info.' })
})
app.get('/info', (request, response) => {
    response.sendFile(path.join(__dirname, '/index.html'))
})

// Wind data routes
app.get('/wind_data/latest', wind_db.getLatestDataFromDatabase)
app.get('/wind_data/:recorded_time', wind_db.getDataByRecordedTime)
app.get('/wind_data', wind_db.getAllDataFromDatabase)

// Air quality data routes
app.get('/latest/average/:type/:sensor_id/:interval?', sensor_db.getLatestAverageDataBySensorID)
app.get('/latest/all/main', sensor_db.getLatestMainDataForAllSensors)
app.get('/latest/all', sensor_db.getLatestDataForAllSensors)

//app.get('/data/export/:sensor_id/:start_date/:end_date', sensor_db.getSensorDataRangeExportCSVForID)
app.get('/data/average/:type/:sensor_id/:start_date/:end_date/:interval?', sensor_db.getAverageRangeDataBySensorID)
app.get('/data/:type/:sensor_id/latest', sensor_db.getDataByTypeLatestForID)
app.get('/data/:type/:sensor_id/:start_date/:end_date/', sensor_db.getRangeDataByTypeBySensorID)
app.get('/data/:sensor_id/:start_date/:end_date/', sensor_db.getSensorDataRangeForID)
app.get('/locations', sensor_db.getSensorLocations)

app.get('/sensors/list', sensor_db.getListOfSensorIDs)
app.get('/sensors/:sensor_id/name', sensor_db.getSensorNameForID)
app.get('/sensors/:sensor_id/location', sensor_db.getSensorLocationForID)
app.get('/sensors/:sensor_id/latest', sensor_db.getLatestSensorDataForID)

app.get('/html/data/:sensor_id/:start_date/:end_date/:interval?', sensor_html.getSensorDataRangeForID)
app.get('/html/sensors/status', sensor_html.getSensorStatus)

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    console.log('MINTS-NOAA API server running on port ' + port + '.')
})