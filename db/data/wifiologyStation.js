const wifiologyStationQueries = require('../queries/wifiologyStation');


async function getStationByID(client, stationID){
    return await wifiologyStationQueries.selectWifiologyStationByStationID(client, stationID);
}

async function getStationByMacAddress(client, macAddress){
    return await wifiologyStationQueries.selectWifiologyStationByMacAddress(client, macAddress);
}


module.exports = {
    getStationByID,
    getStationByMacAddress
};