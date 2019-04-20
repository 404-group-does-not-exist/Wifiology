const { spawnClient } = require("../../../tools");

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const { FeatureFlags } = require("../../../../db/data/featureFlags");
const wifiologyCoreQueries = require("../../../../db/queries/core");
const wifiologyDBCore = require("../../../../db/core");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";

let testData = {};

describe('FeatureFlags', function() {
    beforeEach(async function () {
        let dbClient = await spawnClient(DATABASE_URL);
        try {
            await wifiologyDBCore.resetDatabase(dbClient);
            await wifiologyDBCore.doMigrationUpAsync(DATABASE_URL);
        } finally {
            await dbClient.end();
        }
    });

    it("should allow me to set and retrieve feature flag values", async function(){
        let dbClient = await spawnClient(DATABASE_URL);
        try {
            let ff = new FeatureFlags(null);
            let value = await ff.getFlag('test', dbClient, 'foobar');
            expect(value).to.be.eql('foobar');
            await ff.setFlag('test',true, dbClient);
            value = await ff.getFlag('test', dbClient, 'foobar');
            expect(value).to.be.eql(true);
        } finally {
            await dbClient.end();
        }
    });
});