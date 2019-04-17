const wifiologyServiceSetQueries = require('../queries/wifiologyServiceSet');


async function getServiceSetByID(client, serviceSetID){
    return await wifiologyServiceSetQueries.selectWifiologyServiceSetByServiceSetID(client, serviceSetID);
}

async function getServiceSetByBssid(client, bssid){
    return await wifiologyServiceSetQueries.selectWifiologyServiceSetByBssid(client, bssid);
}


module.exports = {
    getServiceSetByID,
    getServiceSetByBssid
};