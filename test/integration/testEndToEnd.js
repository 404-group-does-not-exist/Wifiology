const { spawn } = require('child_process');
const { spawnClient, randInt } = require("../tools");
const axios = require('axios');
const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;

const { createApplication } = require("../../server");
const wifiologyCoreQueries = require("../../db/queries/core");
const wifiologyDBCore = require("../../db/core");
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";


const runtimeEnv = {
  generateUrl(subUrl){
    return `http://127.0.0.1:${this.port || 5000}${subUrl}`
  },
  async sleep(ms){
    return new Promise(res => setTimeout(res, ms));
  }
};


describe('Wifiology Node.js Application', function() {
  beforeEach(async function () {
    let dbClient = await spawnClient(DATABASE_URL);
    try{
        await wifiologyDBCore.resetDatabase(dbClient);
        await wifiologyDBCore.doMigrationUpAsync(DATABASE_URL);
    }
    finally {
      await dbClient.end();
    }
    // Start the app
    runtimeEnv.app = createApplication(DATABASE_URL, false);
    let port = process.env.TEST_PORT || randInt(5001, 9000);
    runtimeEnv.server = runtimeEnv.app.listen(port);

    runtimeEnv.port = port;
    console.log(`Starting application on port: ${port}`);
  });

  afterEach(async function() {
      console.log("Killing server");
      //runtimeEnv.child.kill();
      runtimeEnv.server.close();
  });

  it('should answer some GET requests with a reasonable status code', async function () {
      let resp = await axios.get(runtimeEnv.generateUrl("/"));
      expect(resp.status).to.be.eql(200);

      resp = await axios.get(runtimeEnv.generateUrl("/api/1.0/ui/"));
      expect(resp.status).to.be.eql(200);
  }).timeout(1000);

  it('should allow me to programmatically create a new user, auth with it, and retrieve user data', async function () {
    let resp = await axios.post(
        runtimeEnv.generateUrl("/api/1.0/users"),
        {
          emailAddress: "foo@bar.com",
          userName: "foobar",
          password: "testPass",
          description: "myUser"
        }
    );
    expect(resp.status).to.be.above(199).and.to.be.below(300);
    let newUser = resp.data;
    expect(newUser.userID).is.a('number');

    let resp2 = await axios.get(
        runtimeEnv.generateUrl("/api/1.0/users"),
        {
          auth: {
            username: "foobar",
            password: "testPass"
          }
        }
    );
    expect(resp2.status).to.be.above(199).and.to.be.below(300);
    let users = resp2.data;
    expect(users.find(u => u.userID === newUser.userID)).to.eql(newUser);

    let resp3 = await axios.get(
      runtimeEnv.generateUrl(`/api/1.0/users/${newUser.userID}`),
      {
        auth: {
          username: "foobar",
          password: "testPass"
        }
      }
    );

    expect(resp3.status).to.be.above(199).and.to.be.below(300);
    expect(resp3.data).to.be.eql(newUser);

    let resp4 = await axios.get(
        runtimeEnv.generateUrl(`/api/1.0/users/me`),
        {
          auth: {
            username: "foobar",
            password: "testPass"
          }
        }
    );

    expect(resp4.status).to.be.above(199).and.to.be.below(300);
    expect(resp4.data).to.be.eql(newUser);
  }).timeout(1000);

  it('should allow me to programmatically create API keys and use them', async function(){
    let resp = await axios.post(
        runtimeEnv.generateUrl("/api/1.0/users"),
        {
          emailAddress: "foo@bar.com",
          userName: "foobar",
          password: "testPass",
          description: "myUser"
        }
    );
    expect(resp.status).to.be.above(199).and.to.be.below(300);
    let newUser = resp.data;
    expect(newUser.userID).is.a('number');

    let resp2 = await axios.post(
        runtimeEnv.generateUrl(`/api/1.0/users/me/apiKeys`),
        {
          description: "My key"
        },
        {
          auth: {
            username: "foobar",
            password: "testPass"
          }
        }
    );
    expect(resp2.status).to.be.above(199).and.to.be.below(300);
    expect(resp2.data).to.have.property('key');
    expect(resp2.data).to.have.property('info');
    let apiKey = resp2.data.key;

    let resp3 = await axios.get(
        runtimeEnv.generateUrl(`/api/1.0/users/me`),
        {
          headers:{
            "X-API-Key": apiKey
          }
        }
    );

    expect(resp3.status).to.be.above(199).and.to.be.below(300);
    expect(resp3.data).to.be.eql(newUser);


  }).timeout(1000);

  it('should allow me to programmatically retrieve nodes from the database through the api', async function(){
      let resp = await axios.post(
          runtimeEnv.generateUrl("/api/1.0/users"),
          {
              emailAddress: "foo@bar.com",
              userName: "foobar",
              password: "testPass",
              description: "myUser"
          }
      );
      expect(resp.status).to.be.above(199).and.to.be.below(300);
      let newUser = resp.data;
      expect(newUser.userID).is.a('number');

      let resp2 = await axios.post(
          runtimeEnv.generateUrl(`/api/1.0/nodes`),
          {
              nodeName: "string",
              nodeLocation: "string",
              nodeDescription: "string",
              isPublic: true,
              nodeData: {foo: "bar"}
          },
          {
              auth: {
                  username: "foobar",
                  password: "testPass"
              }
          }
      );

      expect(resp2.status).to.be.above(199).and.to.be.below(3000);
      let newNode = resp2.data;
      expect(newNode.nodeID).to.be.a('number');

      let resp3 = await axios.get(
          runtimeEnv.generateUrl('/api/1.0/nodes'),
          {
              auth: {
                  username: "foobar",
                  password: "testPass"
              }
          },
      );
      expect(resp3.status).to.be.above(199).and.to.be.below(300);
      let nodes = resp3.data;
      expect(nodes.find(n => n.nodeID === newNode.nodeID)).to.be.eql(newNode);
  }).timeout(1000);
});