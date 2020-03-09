# mints-noaa-api
Combine mints sensors api and noaa wind api

Helpful routes:

NOAA Wind:
GET latest wind data: 
  `/wind_data/latest`
GET wind data by UTC datetime: 
  `/wind_data/:recorded_time`

MINTS Sensor Data:
GET list of sensor IDs:
  `/sensor_id_list`
GET latest data for a sensor ID:
  `/latest/:sensor_id`
GET data for a sensor ID within a datetime range:
  `/data/:sensor_id/:start_date/:end_date`
  
Tip:
  Datetime input format: `YYYY-MM-DDTHH:MM:SS.00Z`
