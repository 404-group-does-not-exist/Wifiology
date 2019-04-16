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

    return {
        newMeasurement,
        stations,
        serviceSets
    }
}


module.exports = {
    loadNewMeasurementData
};