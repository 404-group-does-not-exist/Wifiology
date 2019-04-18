const wifiologyMeasurementQueries = require('../queries/wifiologyMeasurement');
const wifiologyStationQueries = require('../queries/wifiologyStation');
const wifiologyServiceSetQueries = require('../queries/wifiologyServiceSet');
const wifiologyLinkingTableQueries = require('../queries/wifiologyMeasurementLinkingTables');

const measurementFromAPI = require('../models/wifiologyMeasurement').fromAPI;
const stationFromAPI = require('../models/wifiologyStation').fromAPI;
const serviceSetFromAPI = require('../models/wifiologyServiceSet').fromAPI;
const dataCountersFromAPI = require('../models/wifiologyDataCounters').fromAPI;


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
        await wifiologyLinkingTableQueries.insertMeasurementServiceSet(
            client, measurementID, serviceSet.serviceSetID
        );
        await Promise.all(rawServiceSet.associatedMacAddresses.map(
            macAddress => wifiologyLinkingTableQueries.insertServiceSetAssociatedStation(
                client, serviceSet.serviceSetID, macAddress
            )
        ));
        await Promise.all(rawServiceSet.infrastructureMacAddresses.map(
            macAddress => wifiologyLinkingTableQueries.insertServiceSetInfraStation(
                client, serviceSet.serviceSetID, macAddress
            )
        ));
        return serviceSet;
    }
    return execute;
}


async function loadNewMeasurementData(client, newMeasurementData, nodeID){
    let newMeasurement = measurementFromAPI(newMeasurementData, nodeID);
    newMeasurement.measurementID = await wifiologyMeasurementQueries.insertWifiologyMeasurement(client, newMeasurement);
    let mID = newMeasurement.measurementID;

    let newStationsData = newMeasurementData.stations;
    let newServiceSetsData = newMeasurementData.serviceSets;
    let bssidToNetworkNameMap = newMeasurementData.bssidToNetworkNameMap;



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
        let serviceSets;
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
        measurementDataSetConstructor(client)
    );
}


module.exports = {
    loadNewMeasurementData,
    getMeasurementByID,
    getMeasurementsByNodeID,
    getMeasurementsByNodeIDAndChannel,
    getAggregateDataCountersForMeasurementIDs,
    getMeasurementDataSetsByNodeID
};