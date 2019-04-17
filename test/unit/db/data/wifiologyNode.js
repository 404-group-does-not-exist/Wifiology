const { spawnClient } = require("../../../tools");

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const wifilogyNodeModels = require('../../../../db/models/wifiologyNode');
const wifiologyCoreQueries = require("../../../../db/queries/core");
const wifiologyUserData = require("../../../../db/data/wifiologyUser");
const wifiologyNodeData = require("../../../../db/data/wifiologyNode");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";

let testData = {};

describe('WifiologyNodeData', function(){
    beforeEach(async function(){
        let dbClient = await spawnClient(DATABASE_URL);
        try{
            await dbClient.query("DROP SCHEMA public cascade;");
            await dbClient.query("CREATE SCHEMA public;");
            await wifiologyCoreQueries.writeSchema(dbClient);
            testData.testUser = await wifiologyUserData.createNewUser(
                dbClient, "foo@bar.com", "foobar", "foobar",
                {}
            );
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to create new nodes successfully', async function(){

        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newNode = await wifiologyNodeData.createNewWifiologyNode(
                dbClient, "fooNode", "testLoc",
                "my node", testData.testUser.userID, true, {}
            );
            expect(newNode).to.be.an.instanceOf(wifilogyNodeModels.WifiologyNode);
            expect(newNode.nodeID).to.be.a('number');
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to retrieve a nude by its ID or name', async function(){
        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newNode = await wifiologyNodeData.createNewWifiologyNode(
                dbClient, "fooNode", "testLoc",
                "my node", testData.testUser.userID, true, {}
            );
            expect(newNode).to.be.an.instanceOf(wifilogyNodeModels.WifiologyNode);
            expect(newNode.nodeID).to.be.a('number');

            let retrievedNode = await wifiologyNodeData.getWifiologyNodeByID(dbClient, newNode.nodeID);
            expect(retrievedNode).to.be.eql(newNode);

            let retreivedNode2 = await wifiologyNodeData.getWifiologyNodeByName(dbClient, "fooNode");
            expect(retreivedNode2).to.be.eql(newNode);
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to retrieve all known wifiology nodes', async function(){
        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newNode = await wifiologyNodeData.createNewWifiologyNode(
                dbClient, "fooNode", "testLoc",
                "my node", testData.testUser.userID, true, {}
            );
            expect(newNode).to.be.an.instanceOf(wifilogyNodeModels.WifiologyNode);
            expect(newNode.nodeID).to.be.a('number');

            let newNode2 = await wifiologyNodeData.createNewWifiologyNode(
                dbClient, "fooNode2", "testLoc",
                "my node", testData.testUser.userID, true, {}
            );
            expect(newNode2).to.be.an.instanceOf(wifilogyNodeModels.WifiologyNode);
            expect(newNode2.nodeID).to.be.a('number');

            let retrievedNodes = await wifiologyNodeData.getAllWifiologyNodes(dbClient, 500, 0);
            expect(retrievedNodes.find(n => n.nodeID === newNode.nodeID)).to.be.eql(newNode);
            expect(retrievedNodes.find(n => n.nodeID === newNode2.nodeID)).to.be.eql(newNode2);
        }
        finally {
            await dbClient.end();
        }
    });

    it('should allow the developer to retrieve all nodes for a user', async function(){
        let dbClient = await spawnClient(DATABASE_URL);

        try{
            let newNode = await wifiologyNodeData.createNewWifiologyNode(
                dbClient, "fooNode", "testLoc",
                "my node", testData.testUser.userID, true, {}
            );
            expect(newNode).to.be.an.instanceOf(wifilogyNodeModels.WifiologyNode);
            expect(newNode.nodeID).to.be.a('number');

            let newNode2 = await wifiologyNodeData.createNewWifiologyNode(
                dbClient, "fooNode2", "testLoc",
                "my node", testData.testUser.userID, true, {}
            );
            expect(newNode2).to.be.an.instanceOf(wifilogyNodeModels.WifiologyNode);
            expect(newNode2.nodeID).to.be.a('number');

            let retrievedNodes = await wifiologyNodeData.getWifiologyNodesByOwnerID(dbClient, testData.testUser.userID);
            expect(retrievedNodes.find(n => n.nodeID === newNode.nodeID)).to.be.eql(newNode);
            expect(retrievedNodes.find(n => n.nodeID === newNode2.nodeID)).to.be.eql(newNode2);
        }
        finally {
            await dbClient.end();
        }
    });
});