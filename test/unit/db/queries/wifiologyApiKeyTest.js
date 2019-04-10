const { spawnClient } = require("../../tools");

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const wifiologyUserModel = require("../../../../db/models/wifiologyUser");
const wifiologyApiKeyModel = require("../../../../db/models/wifiologyApiKey");
const wifiologyCoreQueries = require("../../../../db/queries/core");
const wifiologyApiKeyQueries = require("../../../../db/queries/wifiologyApiKey");
const wifiologyUserQueries = require("../../../../db/queries/wifiologyUser");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";


describe('WifiologyApiKeyQueries', function(){
    beforeEach(async function(){
        let dbClient = await spawnClient(DATABASE_URL);
        try{
            await dbClient.query("DROP SCHEMA public cascade;");
            await dbClient.query("CREATE SCHEMA public;");
            await wifiologyCoreQueries.writeSchema(dbClient);
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow me to insert a new API Key', async function(){
        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbClient, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let newKeyValue = "foobarbaz";
            let newKeyRecord = await wifiologyApiKeyModel.createNewApiKeyRecord(newUser.userID, newKeyValue, "wat");
            newKeyRecord.apiKeyID = await wifiologyApiKeyQueries.insertWifiologyApiKey(dbClient, newKeyRecord);
            expect(newKeyRecord.apiKeyID).to.be.a('number');
        }
        finally {
            await dbClient.end();
        }
    });

    it('should to look up a user by using the API key', async function(){
        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbClient, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let newKeyValue = "foobarbaz";
            let newKeyRecord = await wifiologyApiKeyModel.createNewApiKeyRecord(newUser.userID, newKeyValue, "wat");

            newKeyRecord.apiKeyID = await wifiologyApiKeyQueries.insertWifiologyApiKey(dbClient, newKeyRecord);
            expect(newKeyRecord.apiKeyID).to.be.a('number');

            let retrievedUser = await wifiologyApiKeyQueries.selectWifiologyUserByApiKey(dbClient, newKeyValue);
            expect(retrievedUser).to.be.eql(newUser);
        }
        finally {
            await dbClient.end();
        }
    });

    it('should be able to allow the developer to look up all keys for a user', async function(){
        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbClient, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let newKeyValue = "foobarbaz";
            let newKeyRecord = await wifiologyApiKeyModel.createNewApiKeyRecord(newUser.userID, newKeyValue, "wat");

            newKeyRecord.apiKeyID = await wifiologyApiKeyQueries.insertWifiologyApiKey(dbClient, newKeyRecord);
            expect(newKeyRecord.apiKeyID).to.be.a('number');


            let newKeyValue2 = "foobarbaz2";
            let newKeyRecord2 = await wifiologyApiKeyModel.createNewApiKeyRecord(newUser.userID, newKeyValue2, "wat");

            newKeyRecord.apiKeyID = await wifiologyApiKeyQueries.insertWifiologyApiKey(dbClient, newKeyRecord);
            expect(newKeyRecord.apiKeyID).to.be.a('number');

            let keys = await wifiologyApiKeyQueries.selectWifiologyApiKeysByOwnerID(dbClient, newUser.userID);
            expect(keys).to.be.length(2);
            expect(keys.find(k => k.apiKeyID === newKeyRecord.apiKeyID)).to.be.eql(newKeyRecord);
        }
        finally {
            await dbClient.end();
        }
    });

});