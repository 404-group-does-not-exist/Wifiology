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
        queryString += " AND measurementID < $measurmentID ";
        params.measurementID = priorLastMeasurementID;
    }
    queryString += " ORDER BY measurementID DESC LIMIT $limit ";
    let result = await client.query(
        queryString, params
    );
    return result.rows.map(r => fromRow(r));
}

async function selectAggregateDataCountersForWifiologyMeasurements(client, measurementIDs){
    /*let queryString = `
    SELECT
        mapMeasurementID,
        SUM(m.managementFrameCount) AS managementFrameCount,
        SUM(m.associationFrameCount) AS associationFrameCount,
        SUM(m.reassociationFrameCount) AS reassociationFrameCount,
        SUM(m.disassociationFrameCount) AS disassociationFrameCount,
        SUM(m.controlFrameCount) AS controlFrameCount,
        SUM(m.rtsFrameCount) AS rtsFrameCount,
        SUM(m.ctsFrameCount) AS ctsFrameCount,
        SUM(m.ackFrameCount) AS ackFrameCount,
        SUM(m.dataFrameCount) AS dataFrameCount,
        SUM(m.dataThroughputIn) AS dataThroughputIn,
        SUM(m.dataThroughputOut) AS dataThroughputOut,
        SUM(m.retryFrameCount) AS retryFrameCount,
        null AS averagePower, -- TODO: weighted average support
        null AS stdDevPower, -- TODO: weighted variance support
        MIN(m.lowestRate) AS lowestRate,
        MAX(m.highestRate) AS highestRate,
        SUM(m.failedFCSCount) AS failedFCSCount
    FROM measurementstationmap AS m
    GROUP BY m.mapmeasurementid
    HAVING m.mapmeasurementid IN
    ` + placeholderConstructor(measurementIDs);*/
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

module.exports = {
    insertWifiologyMeasurement,
    selectWifiologyMeasurementByID,
    selectAllWifiologyMeasurementsForNode,
    selectAllWifiologyMeasurementsForNodeAndChannel,
    selectAggregateDataCountersForWifiologyMeasurements
};