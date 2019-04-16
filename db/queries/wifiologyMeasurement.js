const { fromRow } = require('../models/wifiologyMeasurement');

async function insertWifiologyMeasurement(client, newWifiologyMeasurement) {
    let result = await client.query(
        `INSERT INTO measurement(
            measurementNodeID, measurementStartTime, measurementEndTime,
            measurementDuration, channel, averageNoise, stdDevNoise, extraData
        ) VALUES (
            $measurementNodeID, $measurementStartTime, $measurementEndTime,
            $measurementDuration, $channel, $averageNoise, $stdDevNoise, $extraData
        ) RETURNING measurementID`,
        newWifiologyMeasurement.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].measurementid;
    } else {
        return null;
    }
}


module.exports = {
  insertWifiologyMeasurement
};