const { spawnClient } = require("../../../tools");

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const wifiologyUserModel = require("../../../../db/models/wifiologyUser");
const wifiologyCoreQueries = require("../../../../db/queries/core");
const wifiologyJitterQueries = require("../../../../db/queries/wifiologyServiceSetJitterMeasurement");
const { createNewUser } = require("../../../../db/data/wifiologyUser");
const { createNewWifiologyNode } = require("../../../../db/data/wifiologyNode");
const { createNewServiceSet } = require("../../../../db/data/wifiologyServiceSet");
const { createNewMeasurementFromAPIData } = require("../../../../db/data/wifiologyMeasurement");

const wifiologyDBCore = require("../../../../db/core");

const { WifiologyServiceSetJitterMeasurement, fromAPI, fromRow} =
    require("../../../../db/models/wifiologyServiceSetJitterMeasurement");
const HDRHistogramJS = require('hdr-histogram-js');


const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";


let testData = {};


describe('WifiologyServiceSetJitterMeasurementQueries', function() {
    beforeEach(async function () {
        let dbClient = await spawnClient(DATABASE_URL);
        try {
            await wifiologyDBCore.resetDatabase(dbClient);
            await wifiologyDBCore.doMigrationUpAsync(DATABASE_URL);
            testData.user = await createNewUser(
                dbClient, "foo@aol.com", "foobar","foo",
                {}, false, true
            );
            testData.node = await createNewWifiologyNode(
                dbClient, "fooNode", "???", "???", testData.user.userID,
                true, {}
            );
            testData.measurement = await createNewMeasurementFromAPIData(
                dbClient, {
                    measurementStartTime: 1.0,
                    measurementEndTime: 2.0,
                    measurementDuration: 1.0,
                    channel: 1,
                    averageNoise: null,
                    stdDevNoise: null,
                    extraData: {}
                },
                testData.node.nodeID
            );
            testData.serviceSet = await createNewServiceSet(
                dbClient,
                "00:01:02:03:04:05",
                "test",
                {}
            );
        } finally {
            await dbClient.end();
        }
    });

    it('should allow me to successfully insert and select back jitter measurements', async function () {
        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newJitterMeasurement = fromAPI(
                {
                    minJitter: 1.0,
                    maxJitter: 100.0,
                    avgJitter: 2.5,
                    stdDevJitter: 1.0,
                    jitterHistogram: "HISTFAAAACB4nJNpmSzMwMDAwQABjGh0CozPyMTE5MvEzgQARRICFQ==",
                    jitterHistogramOffset: 100,
                    beaconInterval: 100,
                    extraData: {}

                }, testData.measurement.measurementID, testData.serviceSet.serviceSetID
            );
            await wifiologyJitterQueries.insertWifiologyJitterMeasurement(dbClient, newJitterMeasurement);
            expect(newJitterMeasurement.jitterHistogram).to.be.an.instanceOf(HDRHistogramJS.AbstractHistogram);
            expect(newJitterMeasurement.jitterHistogram.getStdDeviation()).to.be.within(28, 29);
            expect(newJitterMeasurement.jitterHistogram.totalCount).to.be.eql(5);
            expect(newJitterMeasurement.jitterHistogram.minNonZeroValue).to.be.within(1, 5);
            expect(newJitterMeasurement.jitterHistogram.maxValue).to.be.within(64, 68);

            let jitter = await wifiologyJitterQueries.selectWifiologyJitterMeasurementByMeasurementIDAndServiceSetID(
              dbClient, testData.measurement.measurementID, testData.serviceSet.serviceSetID
            );
            expect(jitter.jitterHistogram).to.be.an.instanceOf(HDRHistogramJS.AbstractHistogram);
            expect(jitter.jitterHistogram.getStdDeviation()).to.be.within(28, 29);
            expect(jitter.jitterHistogram.totalCount).to.be.eql(5);
            expect(jitter.jitterHistogram.minNonZeroValue).to.be.within(1, 5);
            expect(jitter.jitterHistogram.maxValue).to.be.within(64, 68);
            for(let key of ['minJitter', 'maxJitter', 'avgJitter', 'stdDevJitter', 'jitterHistogramOffset']){
                expect(jitter[key]).to.be.eql(newJitterMeasurement[key]);
            }
            await wifiologyJitterQueries.selectWifiologyJitterMeasurementsByMeasurementID(
                dbClient, testData.measurement.measurementID
            );
            await wifiologyJitterQueries.selectWifiologyJitterMeasurementsByMeasurementIDs(
                dbClient, [testData.measurement.measurementID]
            );
            await wifiologyJitterQueries.selectWifiologyJitterMeasurementsByServiceSetIDs(
                dbClient, [testData.serviceSet.serviceSetID]
            );
        }
        finally {
            await dbClient.end();
        }
    });
});