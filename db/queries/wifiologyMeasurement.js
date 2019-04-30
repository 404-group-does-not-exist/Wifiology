const { fromRow } = require('../models/wifiologyMeasurement');
const dataCountersFromRow  = require('../models/wifiologyDataCounters').fromRow;
const dataCounterZero = require('../models/wifiologyDataCounters').zero;
const { placeholderConstructor } = require('../queries/core');

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

async function selectWifiologyMeasurementByID(client, measurementID){
    let result = await client.query(
        "SELECT * FROM measurement WHERE measurementID = $1",
        [measurementID]
    );
    if(result.rows.length > 0){
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyMeasurementsByIDs(client, measurementIDs){
    let result = await client.query(
        "SELECT * FROM measurement WHERE measurementID = ANY($measurementIDs)",
        {measurementIDs}
    );
    return result.rows.map(r => fromRow(r));
}

async function selectAllWifiologyMeasurementsForNode(client, nodeID, limit, priorLastMeasurementID) {
    let queryString = "SELECT * FROM measurement WHERE measurementNodeID = $nodeID ";
    params = {nodeID, limit};
    if (typeof priorLastMeasurementID !== 'undefined' && priorLastMeasurementID !== null) {
        queryString += " AND measurementID < $measurementID ";
        params.measurementID = priorLastMeasurementID;
    }
    queryString += " ORDER BY measurementID DESC LIMIT $limit ";
    let result = await client.query(
        queryString, params
    );
    return result.rows.map(r => fromRow(r));
}

async function selectAllWifiologyMeasurementsForNodeAndChannel(client, nodeID, channel, limit, priorLastMeasurementID){
    let queryString = "SELECT * FROM measurement WHERE measurementNodeID = $nodeID AND channel = $channel ";
    params = {nodeID, limit, channel};
    if(typeof priorLastMeasurementID !== 'undefined' && priorLastMeasurementID !== null) {
        queryString += " AND measurementID < $measurementID ";
        params.measurementID = priorLastMeasurementID;
    }
    queryString += " ORDER BY measurementID DESC LIMIT $limit ";
    let result = await client.query(
        queryString, params
    );
    return result.rows.map(r => fromRow(r));
}

async function selectWifiologyMeasurementByNodeIDChannelAndStartTime(client, nodeID, channel, startTime){
    let result = await client.query(
        "SELECT * FROM measurement " +
        "WHERE measurementNodeID = $nodeID AND channel = $channel AND measurementStartTime = $startTime",
        {nodeID, channel, startTime}
    );
    if(result.rows.length > 0){
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectAggregateDataCountersForWifiologyMeasurements(client, measurementIDs){
    let result = await client.query(
        "SELECT * FROM dataCountersForMeasurements($array)",
        {array: measurementIDs}
    );

    // Dumb ass kludge TODO: PLEASE FIX THIS
    let dataCounters = {};
    for(let measurementID of measurementIDs){
        dataCounters[measurementID] = dataCounterZero();
    }
    return result.rows.reduce((acc, row) => {
        acc[row.measurementid] = dataCountersFromRow(row);
        return acc;
    }, dataCounters);
}

async function selectWifiologyMeasurementByUniqueAttributes(client, newMeasurementData){
    let result = await client.query(
        "SELECT * FROM measurement " +
        "WHERE measurementNodeID = $measurementNodeID " +
        "AND channel = $channel " +
        "AND measurementStartTime = $measurementStartTime ",
        newMeasurementData.toRow()
    );
    if(result.rows.length > 0){
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function deleteNodeOldWifiologyMeasurements(client, nodeID, thresholdAgeDays){
    let result = await client.query(
        `DELETE FROM measurement 
         WHERE measurementNodeID = $nodeID 
         AND measurementStartTime < 
           SELECT MAX(measurementStartTime) FROM measurement WHERE measurementNodeID=$nodeID
         ) - make_interval(days := $thresholdAgeDays)
         RETURNING measurementID
        `,
        {nodeID, thresholdAgeDays}
    );
    return result.rows.map(r => r.measurementid);
}

module.exports = {
    insertWifiologyMeasurement,
    selectWifiologyMeasurementByID,
    selectAllWifiologyMeasurementsForNode,
    selectAllWifiologyMeasurementsForNodeAndChannel,
    selectAggregateDataCountersForWifiologyMeasurements,
    deleteNodeOldWifiologyMeasurements,
    selectWifiologyMeasurementByNodeIDChannelAndStartTime,
    selectWifiologyMeasurementByUniqueAttributes,
    selectWifiologyMeasurementsByIDs
};