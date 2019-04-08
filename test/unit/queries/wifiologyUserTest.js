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


mocha.describe('WifiologyUserQueries', function(){
    beforeEach(async function(){
        let dbConnection = new pg.Client({
            connectionString: DATABASE_URL
        });
        await dbConnection.connect();
        await dbConnection.query("DROP SCHEMA public cascade;");
        await dbConnection.query("CREATE SCHEMA public;");
        await wifiologyCoreQueries.writeSchema(dbConnection);
        await dbConnection.end();
    });
    
    it('should allow the developer to insert users correctly', async function(){
        let dbConnection = new pg.Client({
            connectionString: DATABASE_URL
        });
        named.patch(dbConnection);
        await dbConnection.connect();

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbConnection, newUser
            );
            expect(newUser.userID).to.be.a('number');
        }
        finally {
            await dbConnection.end();
        }
    });

    it('should allow the developer to select a user by the user ID', async function(){
        let dbConnection = new pg.Client({
            connectionString: DATABASE_URL
        });
        named.patch(dbConnection);
        await dbConnection.connect();

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbConnection, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let retrievedUser = await wifiologyUserQueries.selectWifiologyUserByID(dbConnection, newUser.userID);
            expect(retrievedUser).to.be.instanceOf(wifiologyUserModel.WifiologyUser);
            expect(retrievedUser).to.be.eql(newUser);
        }
        finally {
            await dbConnection.end();
        }
    });

    it('should allow the developer to select all users', async function(){
        let dbConnection = new pg.Client({
            connectionString: DATABASE_URL
        });
        named.patch(dbConnection);
        await dbConnection.connect();

        try{
            let newUser = await wifiologyUserModel.createNewWifiologyUserWithPassword(
                "bob@aol.com", "bob", {test: "me"}, "test"
            );
            newUser.userID = await wifiologyUserQueries.insertWifiologyUser(
                dbConnection, newUser
            );
            expect(newUser.userID).to.be.a('number');

            let retrievedUsers = await wifiologyUserQueries.selectAllWifiologyUsers(dbConnection, 500, 0);
            expect(retrievedUsers).to.be.length(1);
            expect(retrievedUsers[0]).to.be.eql(newUser);
        }
        finally {
            await dbConnection.end();
        }
    });
});