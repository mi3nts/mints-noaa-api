const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000
const wind_db = require('./wind/wind-queries')
const sensor_db = require('./sensors/queries-air-sensors.js')

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
app.post('/wind_data', wind_db.postDataFromSource)
app.put('/wind_data', wind_db.updateData)
app.get('/wind_data/latest', wind_db.getLatestDataFromDatabase)
app.get('/wind_data/:recorded_time', wind_db.getDataByRecordedTime)
app.delete('/wind_data/old', wind_db.flushOldData)
app.delete('/wind_data/all', wind_db.flushAll)

// Air quality data routes
app.get('/data_pm1', sensor_db.getSensorData)
app.get('/data_pm2_5', sensor_db.getSensorData)
app.get('/data_pm10', sensor_db.getSensorData)

app.get('/sensor_id_list', sensor_db.getListOfSensorIDs)
app.get('/latest', sensor_db.getLatestSensorData)

app.get('/latest/:sensor_id', sensor_db.getLatestSensorDataForID)
app.get('/data/:type/:sensor_id/latest', sensor_db.getDataByTypeLatestForID)
app.get('/data/:type/:sensor_id/:start_date/:end_date/:interval?', sensor_db.getDataByTypeRangeBySensorID)
app.get('/data/:sensor_id/:start_date/:end_date/:interval?', sensor_db.getSensorDataRangeForID)
//app.get('/data_export/:sensor_id/:start_date/:end_date', sensor_db.getSensorDataRangeExportCSVForID)
app.get('/locations', sensor_db.getSensorLocations)
app.get('/location/:sensor_id', sensor_db.getSensorLocationForID)
app.get('/sensorNameOf/:sensor_id', sensor_db.getSensorNameForID)

app.get('/sensors/status', sensor_db.getSensorStatus)

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    console.log('Server running on port ' + port + '.')
})