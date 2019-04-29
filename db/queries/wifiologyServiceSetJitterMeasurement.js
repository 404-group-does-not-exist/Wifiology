const { fromRow } = require('../models/wifiologyServiceSetJitterMeasurement');

async function insertWifiologyJitterMeasurement(client, newJitterMeasurement) {
    await client.query(
        `
        INSERT INTO serviceSetJitterMeasurement(
          measurementID, serviceSetID, minJitter, maxJitter, avgJitter,
          stdDevJitter, jitterHistogram, jitterHistogramOffset, beaconInterval,
          extraData
        ) VALUES ( 
          $measurementID, $serviceSetID, $minJitter, $maxJitter, $avgJitter,
          $stdDevJitter, $jitterHistogram, $jitterHistogramOffset, $beaconInterval,
          $extraData
        )
        `,
        newJitterMeasurement.toRow()
    );
}

async function selectWifiologyJitterMeasurementByMeasurementIDAndServiceSetID(client, measurementID, serviceSetID){
    let result = await client.query(
        `SELECT * FROM serviceSetJitterMeasurement WHERE measurementID = $1 AND serviceSetID = $2`,
        [measurementID, serviceSetID]
    );
    if(result.rows.length > 0){
        return fromRow(result.rows[0])
    }
    else {
        return null;
    }
}

async function selectWifiologyJitterMeasurementsByMeasurementID(client, measurementID) {
    let result = await client.query(
        `SELECT * FROM serviceSetJitterMeasurement WHERE measurementID = $1`,
        [measurementID]
    );
    return result.rows.map(r => fromRow(r));
}

async function selectWifiologyJitterMeasurementsByMeasurementIDs(client, measurementIDs) {
    let result = await client.query(
        `SELECT * FROM serviceSetJitterMeasurement WHERE measurementID = ANY($measurementIDs)`,
        {measurementIDs}
    );
    return result.rows.map(r => fromRow(r));
}

async function selectWifiologyJitterMeasurementsByServiceSetIDs(client, serviceSetIDs) {
    let result = await client.query(
        `SELECT * FROM serviceSetJitterMeasurement WHERE serviceSetID = ANY($serviceSetIDs)`,
        {serviceSetIDs}
    );
    return result.rows.map(r => fromRow(r));
}


async function selectServiceSetLatestJitterData(client, serviceSetID, limit=10){
    let result = await client.query(
        `
        SELECT (avgJitter/1000.0)/beaconInterval AS "relativeAverageJitter", 
               (stdDevJitter/1000.0)/beaconInterval AS "relativeDeviationJitter", 
               (maxJitter/1000.0)/beaconInterval AS "relativeMaxJitter",
               m.measurementStartTime AS "jitterMeasurementTime"
        FROM serviceSetJitterMeasurement AS j
        JOIN measurement AS m on j.measurementID = m.measurementID
        WHERE j.serviceSetID = $serviceSetID
        ORDER BY j.measurementID DESC
        LIMIT $limit
        `,
        {serviceSetID, limit}
    );
    return result.rows;
}

module.exports = {
    insertWifiologyJitterMeasurement,
    selectWifiologyJitterMeasurementsByMeasurementID,
    selectWifiologyJitterMeasurementsByMeasurementIDs,
    selectWifiologyJitterMeasurementsByServiceSetIDs,
    selectWifiologyJitterMeasurementByMeasurementIDAndServiceSetID,
    selectServiceSetLatestJitterData
};