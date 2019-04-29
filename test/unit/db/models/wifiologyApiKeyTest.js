const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const wifiologyApiKey = require("../../../../db/models/wifiologyApiKey");


describe('WifiologyApiKey', function(){
    it('should the required fields as parameters', function() {
        let someTime = new Date();
        let apiKey = new wifiologyApiKey.WifiologyApiKey(1, 2, "asfasf", "test",  someTime);
        expect(apiKey.apiKeyID).to.be.eql(1);
        expect(apiKey.ownerID).to.be.eql(2);
        expect(apiKey.apiKeyHash).to.be.eql("asfasf");
        expect(apiKey.apiKeyDescription).to.be.eql("test");
        expect(apiKey.apiKeyExpiry).to.be.eql(someTime);
    });

    it('should set and verify the has correctly', async function(){
        let key = await wifiologyApiKey.createNewApiKeyRecord(1, "foobar", "wat");
        expect(await key.verifyHash("foobar")).to.be.true;
        expect(key.apiKeyHash).to.not.be.eql("foobar");
    });
});