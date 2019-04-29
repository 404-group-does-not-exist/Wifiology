const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');
const wifiologyUser = require("../../../../db/models/wifiologyUser");


describe('WifiologyUser', function(){
    it('should have the userID, emailAddress, userName, userData, passwordData parameters', function() {
       let user = new wifiologyUser.WifiologyUser(1, "foo@aol.com", "bob", {foo: "bar"}, null);
       expect(user.userID).to.eql(1);
       expect(user.emailAddress).to.eql("foo@aol.com");
       expect(user.userName).to.eql("bob");
       expect(user.userData).to.eql({foo: "bar"});
       expect(user.passwordData).to.eql(null);
    });

    it('should verify a password correctly', async function(){
       let user = await wifiologyUser.createNewWifiologyUserWithPassword(
           "foo@aol.com", "bob", {}, "saget"
       );
       expect(await user.verifyPassword("saget")).to.be.true;
    });
});