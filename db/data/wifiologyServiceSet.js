const wifiologyServiceSetQueries = require('../queries/wifiologyServiceSet');
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


module.exports = {
    createNewServiceSet,
    getServiceSetByID,
    getServiceSetByBssid,
    getDistinctServiceSetsByNodeIDs
};