const wifiologyServiceSetQueries = require('../queries/wifiologyServiceSet');
const wifiologyLinkingTableQueries = require('../queries/wifiologyMeasurementLinkingTables');
const { WifiologyServiceSet } = require("../models/wifiologyServiceSet");

async function createNewServiceSet(client, bssid, networkName, extraData){
    let ss = new WifiologyServiceSet(null, bssid, networkName, extraData);
    ss.serviceSetID = await wifiologyServiceSetQueries.insertWifiologyServiceSet(client, ss);
    return ss;
}


async function getServiceSetByID(client, serviceSetID){
    return await wifiologyServiceSetQueries.selectWifiologyServiceSetByServiceSetID(client, serviceSetID);
}

async function getServiceSetByBssid(client, bssid){
    return await wifiologyServiceSetQueries.selectWifiologyServiceSetByBssid(client, bssid);
}

async function getDistinctServiceSetsByNodeIDs(client, nodeIDs){
    return await wifiologyServiceSetQueries.selectDistinctServiceSetsByNodeIDs(client, nodeIDs);
}

async function getServiceSetRecentData(client, serviceSetID, nodeIDs, limit=500){
    let measurementIDs = await wifiologyLinkingTableQueries.selectRecentServiceSetMeasurementIDs(
         client, serviceSetID, nodeIDs, limit
    );
    let infraMacs = await wifiologyLinkingTableQueries.selectServiceSetInfraMacsOverMeaurements(
         client, serviceSetID, measurementIDs
    );
    let associatedMacs = await wifiologyLinkingTableQueries.selectServiceSetAssociatedMacsOverMeaurements(
         client, serviceSetID, measurementIDs
    );

    return {
        infrastructurMacAddresses: infraMacs,
        associatedMacAddresses: associatedMacs
    }
}


module.exports = {
    createNewServiceSet,
    getServiceSetByID,
    getServiceSetByBssid,
    getDistinctServiceSetsByNodeIDs,
    getServiceSetRecentData
};