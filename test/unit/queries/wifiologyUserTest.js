const pg = require('pg');
const named = require('node-postgres-named');

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const wifiologyUserModel = require("../../../models/wifiologyUser");
const wifiologyCoreQueries = require("../../../queries/core");
const wifiologyUserQueries = require("../../../queries/wifiologyUser");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";

async function spawnClient(){
    let dbClient = new pg.Client({
        connectionString: DATABASE_URL
    });
    named.patch(dbClient);
    await dbClient.connect();
    return dbClient
}

mocha.describe('WifiologyUserQueries', function(){
    beforeEach(async function(){
        let dbClient = await spawnClient();
        try{
            await dbClient.query("DROP SCHEMA public cascade;");
            await dbClient.query("CREATE SCHEMA public;");
            await wifiologyCoreQueries.writeSchema(dbClient);
        }
        finally {
            await dbClient.end();
        }
    });
    
    it('should allow the developer to insert users correctly', async function(){

        let dbClient = await spawnClient();

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbClient, newUser
            );
            expect(newUser.userID).to.be.a('number');
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to select a user by the user ID', async function(){

        let dbClient = await spawnClient();

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbClient, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let retrievedUser = await wifiologyUserQueries.selectWifiologyUserByID(dbClient, newUser.userID);
            expect(retrievedUser).to.be.instanceOf(wifiologyUserModel.WifiologyUser);
            expect(retrievedUser).to.be.eql(newUser);

            let unrealUser = await wifiologyUserQueries.selectWifiologyUserByID(dbClient, 9999);
            expect(unrealUser).to.be.null;
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to select a user by their userName', async function() {
        let dbClient = await spawnClient();

        try {
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbClient, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let retrievedUser = await wifiologyUserQueries.selectWifiologyUserByUserName(dbClient, "bob");
            expect(retrievedUser).to.be.instanceOf(wifiologyUserModel.WifiologyUser);
            expect(retrievedUser).to.be.eql(newUser);

            let unrealUser = await wifiologyUserQueries.selectWifiologyUserByUserName(dbClient, "alice");
            expect(unrealUser).to.be.null;
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to select all users', async function(){
        let dbClient = await spawnClient();

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbClient, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let retrievedUsers = await wifiologyUserQueries.selectAllWifiologyUsers(dbClient, 500, 0);
            expect(retrievedUsers).to.be.length(1);
            expect(retrievedUsers[0]).to.be.eql(newUser);
        }
        finally {
            await dbClient.end();
        }
    });
});