const express = require('express')
const bodyParser = require('body-parser')
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
    response.json({info: 'Node.js, Express, and Postgres API' })
})
app.get('/health', (request, response) => {
    response.json({message: 'GET HEALTH STATUS : OK !'})
})

// Wind data routes
app.get('/wind_data', wind_db.getAllDataFromDatabase)
app.get('/wind_data/latest', wind_db.getLatestDataFromDatabase)
app.get('/wind_data/:recorded_time', wind_db.getDataByRecordedTime)

// Air quality data routes
app.get('/sensor_id_list', sensor_db.getListOfSensorIDs)
app.get('/latest', sensor_db.getLatestSensorData)

app.get('/latest/:sensor_id', sensor_db.getLatestSensorDataForID)
//app.get('/data/export/:sensor_id/:start_date/:end_date', sensor_db.getSensorDataRangeExportCSVForID)
app.get('/data/:type/:sensor_id/latest', sensor_db.getDataByTypeLatestForID)
app.get('/data/:type/:sensor_id/:start_date/:end_date/:interval?', sensor_db.getRangeDataByTypeBySensorID)
app.get('/data/:sensor_id/:start_date/:end_date/:interval?', sensor_db.getSensorDataRangeForID)
app.get('/locations', sensor_db.getSensorLocations)
app.get('/location/:sensor_id', sensor_db.getSensorLocationForID)
app.get('/sensorNameOf/:sensor_id', sensor_db.getSensorNameForID)

app.get('/sensors/status', sensor_html.getSensorStatus)
app.get('/html/data/:sensor_id/:start_date/:end_date/:interval?', sensor_html.getSensorDataRangeForID)

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    console.log('Server running on port ' + port + '.')
})