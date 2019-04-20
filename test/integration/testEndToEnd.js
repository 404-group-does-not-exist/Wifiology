const { spawn } = require('child_process');
const { spawnClient } = require("../tools");
const axios = require('axios');
const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;

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
    const env = Object.assign({}, process.env, {PORT: 5000, DATABASE_URL: DATABASE_URL});
    runtimeEnv.port = env.PORT;
    console.log(`Starting application on port: ${env.PORT}`);
    runtimeEnv.child = spawn('node', ['server.js'], {env});
    await runtimeEnv.sleep(1000);
  });

  afterEach(async function() {
      console.log("Killing server");
      runtimeEnv.child.kill();
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
});