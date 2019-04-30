const wifiologyServiceSetQueries = require('../queries/wifiologyServiceSet');
const wifiologyLinkingTableQueries = require('../queries/wifiologyMeasurementLinkingTables');
const wifiologyMeasurementQueries = require('../queries/wifiologyMeasurement');
const { WifiologyServiceSet } = require("../models/wifiologyServiceSet");
const { lookupMac } = require('../../util/macLookup');

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

    let infraMacManufacturerCounts = {};
    let associatedMacManufacturerCounts = {};
    let seenMacs = [];

    for(let mID of Object.keys(infraMacs)){
        for(let mac of infraMacs[mID]){
            if(!seenMacs.includes(mac)){
                let manufacturer = lookupMac(mac);
                if(!infraMacManufacturerCounts.hasOwnProperty(manufacturer)){
                    infraMacManufacturerCounts[manufacturer] = 1;
                } else {
                    infraMacManufacturerCounts[manufacturer] += 1;
                }
                seenMacs.push(mac);
            }
        }
    }

    seenMacs = [];
    for(let mID of Object.keys(associatedMacs)){
        for(let mac of associatedMacs[mID]){
            if(!seenMacs.includes(mac)){
                let manufacturer = lookupMac(mac);
                if (!associatedMacManufacturerCounts.hasOwnProperty(manufacturer)) {
                    associatedMacManufacturerCounts[manufacturer] = 1;
                } else {
                    associatedMacManufacturerCounts[manufacturer] += 1;
                }
                seenMacs.push(mac);
            }
        }
    }

    let infraDataCounters = await wifiologyServiceSetQueries.selectInfraDataCountersForMeasurementsAndServiceSets(
         client, measurementIDs, [serviceSetID]
    );
    if(infraDataCounters){
        infraDataCounters = infraDataCounters[serviceSetID] || {}
    }
    else {
        infraDataCounters = {};
    }
    let associatedDataCounters = await wifiologyServiceSetQueries.selectAssociatedStationDataCountersForMeasurementsAndServiceSets(
         client, measurementIDs, [serviceSetID]
    );
    if(associatedDataCounters){
        associatedDataCounters = associatedDataCounters[serviceSetID] || {}
    }
    else {
        associatedDataCounters = {};
    }

    let measurements = await wifiologyMeasurementQueries.selectWifiologyMeasurementsByIDs(
         client, measurementIDs
    );
    return {
        measurements: measurements,
        infrastructureMacAddresses: infraMacs,
        infrastructureMacAddressManufacturerCounts: infraMacManufacturerCounts,
        associatedMacAddressManufacturerCounts: associatedMacManufacturerCounts,
        associatedMacAddresses: associatedMacs,
        infrastructureDataCounters: infraDataCounters,
        associatedStationsDataCounters: associatedDataCounters
    }
}


module.exports = {
    createNewServiceSet,
    getServiceSetByID,
    getServiceSetByBssid,
    getDistinctServiceSetsByNodeIDs,
    getServiceSetRecentData
};