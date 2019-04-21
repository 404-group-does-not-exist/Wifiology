const { fromRow } = require('../models/wifiologyStation');
const dataCountersFromRow = require('../models/wifiologyDataCounters').fromRow;

async function insertWifiologyStation(client, newWifiologyStation) {
    let result = await client.query(
        `INSERT INTO station(
            macaddress, extraData
        ) VALUES (
           $macAddress, $extraData
        ) RETURNING stationid`,
        newWifiologyStation.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].stationid;
    } else {
        return null;
    }
}

async function selectWifiologyStationByMacAddress(client, macAddress) {
    let result = await client.query(
        `SELECT * FROM station WHERE macAddress = $1`,
        [macAddress]
    );
    if(result.rows.length > 0) {
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyStationByStationID(client, stationID){
    let result = await client.query(
        `SELECT * FROM station WHERE stationID = $1`,
        [stationID]
    );
    if(result.rows.length > 0) {
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyStationsWithDataCountersByMeasurementID(client, measurementID){
    let result = await client.query(
        `SELECT m.*, s.*
         FROM measurementstationmap AS m
         JOIN station AS s ON m.mapstationid = s.stationid
         WHERE m.mapMeasurementID = $1
        `,
        [measurementID]
    );
    return result.rows.map(r => fromRow(r, dataCountersFromRow(r)));
}


module.exports = {
    insertWifiologyStation,
    selectWifiologyStationByMacAddress,
    selectWifiologyStationByStationID,
    selectWifiologyStationsWithDataCountersByMeasurementID
};