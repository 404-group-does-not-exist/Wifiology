const wifiologyMeasurementQueries = require('../queries/wifiologyMeasurement');
const wifiologyStationQueries = require('../queries/wifiologyStation');
const wifiologyServiceSetQueries = require('../queries/wifiologyServiceSet');
const wifiologyLinkingTableQueries = require('../queries/wifiologyMeasurementLinkingTables');
const wifiologyNodeQueries = require('../queries/wifiologyNode');
const wifiologyJitterQueries = require('../queries/wifiologyServiceSetJitterMeasurement');

const measurementFromAPI = require('../models/wifiologyMeasurement').fromAPI;
const stationFromAPI = require('../models/wifiologyStation').fromAPI;
const serviceSetFromAPI = require('../models/wifiologyServiceSet').fromAPI;
const dataCountersFromAPI = require('../models/wifiologyDataCounters').fromAPI;
const jitterMeasurementFromAPI = require('../models/wifiologyServiceSetJitterMeasurement').fromAPI;


async function lookupOrLoadNewStation(client, rawNewStation){
    let optStation = await wifiologyStationQueries.selectWifiologyStationByMacAddress(client, rawNewStation.macAddress);
    if(optStation){
        return optStation;
    }
    else {
        let newStation = stationFromAPI(rawNewStation);
        newStation.stationID = await wifiologyStationQueries.insertWifiologyStation(client, newStation);
        return newStation;
    }
}

function loadStationMeasurementDataCountersConstructor(client, rawStation, measurementID){
    async function execute(station){
        let dataCounters = dataCountersFromAPI(rawStation.dataCounters);
        await wifiologyLinkingTableQueries.insertMeasurementStationLink(
            client, measurementID, station.stationID, dataCounters
        );
        return station;
    }
    return execute;
}

async function lookupOrLoadNewServiceSet(client, rawNewServiceSet){
    let optServiceSet = await wifiologyServiceSetQueries.selectWifiologyServiceSetByBssid(
        client, rawNewServiceSet.bssid
    );
    if(optServiceSet){
        return optServiceSet;
    }
    else {
        let newServiceSet = serviceSetFromAPI(rawNewServiceSet);
        newServiceSet.serviceSetID = await wifiologyServiceSetQueries.insertWifiologyServiceSet(client, newServiceSet);
        return newServiceSet;
    }
}


function loadServiceSetAdditionalInfoConstructor(client, rawServiceSet, measurementID){
    async function execute(serviceSet){
        await Promise.all(rawServiceSet.associatedMacAddresses.map(
            macAddress => wifiologyLinkingTableQueries.insertServiceSetAssociatedStation(
                client, measurementID, serviceSet.serviceSetID, macAddress
            )
        ));
        await Promise.all(rawServiceSet.infrastructureMacAddresses.map(
            macAddress => wifiologyLinkingTableQueries.insertServiceSetInfraStation(
                client, measurementID, serviceSet.serviceSetID, macAddress
            )
        ));
        if(rawServiceSet.jitterMeasurement){
            await wifiologyJitterQueries.insertWifiologyJitterMeasurement(
                client, jitterMeasurementFromAPI(
                    rawServiceSet.jitterMeasurement, measurementID, serviceSet.serviceSetID
                )
            );
        }
        return serviceSet;
    }
    return execute;
}

async function createNewMeasurementFromAPIData(client, rawMeasurement, nodeID){
    let newMeasurement = measurementFromAPI(rawMeasurement, nodeID);
    newMeasurement.measurementID = await wifiologyMeasurementQueries.insertWifiologyMeasurement(client, newMeasurement);
    return newMeasurement;
}


async function loadNewMeasurementData(client, rawMeasurementDataSet, nodeID){
    await wifiologyNodeQueries.updateNodeLastSeen(client, nodeID);
    let newMeasurement = await createNewMeasurementFromAPIData(client, rawMeasurementDataSet, nodeID);
    let mID = newMeasurement.measurementID;

    let newStationsData = rawMeasurementDataSet.stations;
    let newServiceSetsData = rawMeasurementDataSet.serviceSets;
    let bssidToNetworkNameMap = rawMeasurementDataSet.bssidToNetworkNameMap;



    let stations = await Promise.all(
        newStationsData.map(rawStation =>
            lookupOrLoadNewStation(client, rawStation)
                .then(loadStationMeasurementDataCountersConstructor(client, rawStation, mID))
        )
    );
    let serviceSets = await Promise.all(
        newServiceSetsData.map(rawSS =>
            lookupOrLoadNewServiceSet(client, rawSS)
                .then(loadServiceSetAdditionalInfoConstructor(client, rawSS, mID))
        )
    );

    await Promise.all(Object.keys(bssidToNetworkNameMap).map((key, _) => {
       return wifiologyLinkingTableQueries.updateServiceSetNetworkNameIfNeeded(client, key, bssidToNetworkNameMap[key]);
    }));

    return {
        newMeasurement,
        stations,
        serviceSets
    }
}


async function getMeasurementByID(client, measurementID){
    return await wifiologyMeasurementQueries.selectWifiologyMeasurementByID(client, measurementID);
}

async function getMeasurementsByNodeID(client, nodeID, limit, lastPriorMeasurmentID=null){
    return await wifiologyMeasurementQueries.selectAllWifiologyMeasurementsForNode(
        client, nodeID, limit, lastPriorMeasurmentID
    );
}

async function getMeasurementsByNodeIDAndChannel(client, nodeID, channel, limit, lastPriorMeasurmentID=null) {
    return await wifiologyMeasurementQueries.selectAllWifiologyMeasurementsForNodeAndChannel(
        client, nodeID, channel, limit, lastPriorMeasurmentID
    );
}

async function getAggregateDataCountersForMeasurementIDs(client, measurementIDs){
    return await wifiologyMeasurementQueries.selectAggregateDataCountersForWifiologyMeasurements(
        client, measurementIDs
    );
}


function measurementDataSetConstructor(client){
    async function execute(measurement){
        let stations = await wifiologyStationQueries.selectWifiologyStationsWithDataCountersByMeasurementID(
            client, measurement.measurementID
        );
        let serviceSets = await wifiologyServiceSetQueries.selectWifiologyServiceSetsByMeasurementID(
            client, measurement.measurementID
        );
        let serviceSetIDs = serviceSets.map(ss => ss.serviceSetID);
        let jitterMeasurements = await wifiologyJitterQueries.selectWifiologyJitterMeasurementsByMeasurementID(
            client, measurement.measurementID
        );
        let jitterMeasurementMap = {};
        for(let jitterMeasurement of jitterMeasurements){
            jitterMeasurementMap[jitterMeasurement.serviceSetID] = jitterMeasurement;
        }

        let infraMacAddressMap = await wifiologyLinkingTableQueries.selectAggregateWifiologyServiceSetInfraMacAddresses(
            client, measurement.measurementID, serviceSetIDs
        );
        let associatedMacAddressMap = await wifiologyLinkingTableQueries.selectAggregateWifiologyServiceSetAssociatedMacAddresses(
            client, measurement.measurementID, serviceSetIDs
        );
        for(let serviceSet of serviceSets){
            serviceSet.infraMacAddresses = infraMacAddressMap[serviceSet.serviceSetID] || [];
            serviceSet.associatedMacAddresses = associatedMacAddressMap[serviceSet.serviceSetID] || [];
            serviceSet.jitterMeasurement = jitterMeasurementMap[serviceSet.serviceSetID] || null;
        }

        return {
            measurement: measurement,
            stations: stations,
            serviceSets: serviceSets
        }
    }
    return execute;
}


async function getMeasurementDataSetsByNodeID(client, nodeID, limit, lastPriorMeasurementID=null){
    let measurements = await getMeasurementsByNodeID(client, nodeID, limit, lastPriorMeasurementID);
    let measurementDataCounters = await getAggregateDataCountersForMeasurementIDs(
        client, measurements.map(m => m.measurementID)
    );
    for(let m of measurements){
        m.dataCounters = measurementDataCounters[m.measurementID] || null;
    }
    return await Promise.all(
        measurements.map(measurementDataSetConstructor(client))
    );
}

async function getMeasurementDataSetsByNodeIDAndChannel(client, nodeID, channel, limit, lastPriorMeasurementID=null){
    let measurements = await getMeasurementsByNodeIDAndChannel(client, nodeID, channel, limit, lastPriorMeasurementID);
    let measurementDataCounters = await getAggregateDataCountersForMeasurementIDs(
        client, measurements.map(m => m.measurementID)
    );
    for(let m of measurements){
        m.dataCounters = measurementDataCounters[m.measurementID] || null;
    }
    return await Promise.all(
        measurements.map(measurementDataSetConstructor(client))
    );
}

function measurementDataSetToApiResponse(mds){
    return {
        measurement: mds.measurement.toApiResponse(),
        stations: mds.stations.map(s => s.toApiResponse()),
        serviceSets: mds.serviceSets.map(ss => ss.toApiResponse())
    }
}

async function cleanUpOldWifiologyMeasurements(client, maximumAgeDays){
    for(let node of await wifiologyNodeQueries.selectAllWifiologyNodes(client, 9999, 0)){
        await wifiologyMeasurementQueries.deleteNodeOldWifiologyMeasurements(
            client, node.nodeID, maximumAgeDays
        );
    }
}

async function getWifiologyMeasurementByNodeIDChannelAndStartTime(client, nodeID, channel, startTime){
    return await wifiologyMeasurementQueries.selectWifiologyMeasurementByNodeIDChannelAndStartTime(
        client, nodeID, channel, startTime
    )
}

async function getWifiologyMeasurementDuplicate(client, newMeasurementData, nodeID){
    let newMeasurement = measurementFromAPI(newMeasurementData, nodeID);
    return await wifiologyMeasurementQueries.selectWifiologyMeasurementByUniqueAttributes(
        client, newMeasurement
    );
}


module.exports = {
    loadNewMeasurementData,
    getMeasurementByID,
    getMeasurementsByNodeID,
    getMeasurementsByNodeIDAndChannel,
    getAggregateDataCountersForMeasurementIDs,
    getMeasurementDataSetsByNodeID,
    getMeasurementDataSetsByNodeIDAndChannel,
    measurementDataSetToApiResponse,
    cleanUpOldWifiologyMeasurements,
    getWifiologyMeasurementByNodeIDChannelAndStartTime,
    getWifiologyMeasurementDuplicate,
    createNewMeasurementFromAPIData
};