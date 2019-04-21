const { spawnClient, randFloat, randBool, randInt, randomChoice, randRange } = require("../../../tools");

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const randomMac = require('random-mac');

const wifiologyCoreQueries = require("../../../../db/queries/core");
const wifiologyUserData = require("../../../../db/data/wifiologyUser");
const wifiologyNodeData = require("../../../../db/data/wifiologyNode");
const wifiologyMeasurementData = require("../../../../db/data/wifiologyMeasurement");
const wifiologyStationData = require('../../../../db/data/wifiologyStation');
const wifiologyServiceSetData = require('../../../../db/data/wifiologyServiceSet');
const wifiologyDBCore = require("../../../../db/core");

const { WifiologyMeasurement } = require('../../../../db/models/wifiologyMeasurement');
const { WifiologyStation } = require('../../../../db/models/wifiologyStation');
const { WifiologyServiceSet } = require('../../../../db/models/wifiologyServiceSet');
const { WifiologyDataCounters } = require('../../../../db/models/wifiologyDataCounters');

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";

let testData = {};


function generateFakeRawDataCounters(){
    let base = {
        associationFrameCount: randInt(0, 20),
        reassociationFrameCount: randInt(0, 10),
        disassociationFrameCount: randInt(0, 5),
        rtsFrameCount: randInt(1, 25),
        ctsFrameCount: randInt(1, 25),
        ackFrameCount: randInt(2, 50),
        dataFrameCount: randInt(0, 200),
        dataThroughputIn: randInt(0, 10000),
        dataThroughputOut: randInt(0, 25000),
        retryFrameCount: randInt(0, 75),
        averagePower: randFloat(0, 100),
        stdDevPower: randFloat(0, 20),
        lowestRate: randInt(0, 2),
        highestRate: randInt(2, 10),
        failedFCSCount: randInt(0, 3)
    };

    base.managementFrameCount = base.associationFrameCount + base.reassociationFrameCount
        + base.disassociationFrameCount + randInt(10, 100);
    base.controlFrameCount = base.rtsFrameCount + base.ctsFrameCount + base.ackFrameCount +
        randInt(0, 200);
    return base;
}

function generateFakeRawStation(){
    return {
        macAddress: randomMac("00:01:02"),
        dataCounters: generateFakeRawDataCounters(),
        extraData: {}
    }
}

function generateFakeRawServiceSet(fakeRawStations){
    return {
        bssid: randomMac("00:02:03"),
        networkName: randInt(0.5)? "foobar": null,
        infrastructureMacAddresses: [randomChoice(fakeRawStations).macAddress],
        associatedMacAddresses: [randomChoice(fakeRawStations).macAddress],
        extraData: {}
    }
}


function generateFakeRawMeasurment(extraData){
    let stations = randRange(2, 10).map(
      _ => generateFakeRawStation()
    );

    let serviceSet = generateFakeRawServiceSet(stations);
    let bssidToNetworkNameMap;

    if(randBool(0.5)){
        bssidToNetworkNameMap = {"foobar": serviceSet.bssid}
    } else {
        bssidToNetworkNameMap = {}
    }

    return {
        measurementStartTime: randFloat(0.0, 100.0),
        measurementEndTime: randFloat(100.0, 200.0),
        measurementDuration: randFloat(99, 101),
        channel: randInt(1, 11),
        averageNoise: randFloat(0, 100),
        stdDevNoise: randFloat(0, 20),
        stations: stations,
        serviceSets: [serviceSet],
        bssidToNetworkNameMap: bssidToNetworkNameMap,
        extraData: extraData
    }
}

describe('WifiologyMeasurementData', function(){
    beforeEach(async function(){
        let dbClient = await spawnClient(DATABASE_URL);
        try{
            await wifiologyDBCore.resetDatabase(dbClient);
            await wifiologyDBCore.doMigrationUpAsync(DATABASE_URL);
            testData.testUser = await wifiologyUserData.createNewUser(
                dbClient, "foo@bar.com", "foobar", "foobar",
                {}
            );
            testData.testNode = await wifiologyNodeData.createNewWifiologyNode(
                dbClient, "fooNode", "testLoc",
                "my node", testData.testUser.userID, true, {}
            );
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to add a new measurement successfully', async function(){

        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let rawMeasurement = generateFakeRawMeasurment({});
            let result = await wifiologyMeasurementData.loadNewMeasurementData(
                dbClient,
                rawMeasurement,
                testData.testNode.nodeID
            );
            expect(result.newMeasurement).is.an.instanceOf(WifiologyMeasurement);
            let mID = result.newMeasurement.measurementID;
            result.stations.map(s =>
                expect(s).to.be.an.instanceOf(WifiologyStation)
            );
            result.serviceSets.map( ss =>
                expect(ss).to.be.an.instanceOf(WifiologyServiceSet)
            );

            expect(await wifiologyMeasurementData.getMeasurementByID(dbClient, mID)).to.be.eql(result.newMeasurement);

            let measurements1 = await wifiologyMeasurementData.getMeasurementsByNodeID(
                dbClient, testData.testNode.nodeID, 500
            );
            expect(measurements1.find(m => m.measurementID === mID)).to.be.eql(result.newMeasurement);

            let measurements2 = await wifiologyMeasurementData.getMeasurementsByNodeIDAndChannel(
                dbClient, testData.testNode.nodeID, rawMeasurement.channel, 500
            );
            expect(measurements2.find(m => m.measurementID === mID)).to.be.eql(result.newMeasurement);

            let dcs = await wifiologyMeasurementData.getAggregateDataCountersForMeasurementIDs(dbClient, [mID]);
            expect(dcs).to.have.key(mID);
            expect(dcs[mID]).to.be.an.instanceOf(WifiologyDataCounters);

            for(let station of result.stations){
                expect(station).to.be.eql(await wifiologyStationData.getStationByID(dbClient, station.stationID));
                expect(station).to.be.eql(await wifiologyStationData.getStationByMacAddress(dbClient, station.macAddress));
            }

            for(let serviceSet of result.serviceSets){
                expect(serviceSet).to.be.eql(await wifiologyServiceSetData.getServiceSetByID(dbClient, serviceSet.serviceSetID));
                expect(serviceSet).to.be.eql(await wifiologyServiceSetData.getServiceSetByBssid(dbClient, serviceSet.bssid));
            }
        }
        finally {
            await dbClient.end();
        }
    });


});