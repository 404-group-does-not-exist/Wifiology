const { fromRow } = require('../models/wifiologyStation');

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


module.exports = {
    insertWifiologyStation,
    selectWifiologyStationByMacAddress,
    selectWifiologyStationByStationID
};