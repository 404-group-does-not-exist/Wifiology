const cryptoAsync = require('../util/cryptoPromise');
const hashBytes = 64;
const saltBytes = 16;
const iterations = 10000;
const hashAlgo = 'sha512';

class WifiologyUser {
    constructor(userID, emailAddress, userName, userData, passwordData) {
        this.userID = userID;
        this.emailAddress = emailAddress;
        this.userName = userName;
        this.userData = userData;
        this.passwordData = passwordData;
    }

    toRow() {
        return {
            userID: this.userID,
            emailAddress: this.emailAddress,
            userName: this.userName,
            userData: this.userData,
            passwordData: this.passwordData
        }
    }

    async verifyPassword(password) {
        let saltBytes = this.passwordData.readUInt32BE(0);
        let hashBytes = this.passwordData.length - saltBytes - 8;
        let iterations = this.passwordData.readUInt32BE(4);
        let salt = this.passwordData.slice(8, saltBytes + 8);
        let hash = this.passwordData.toString('binary', saltBytes + 8);

        // verify the salt and hash against the password
        let testHash =  await cryptoAsync.pbkdf2Async(password, salt, iterations, hashBytes, hashAlgo);
        return testHash.toString('binary') === hash;
    }

}

function wifiologyUserFromRow(row){
    return new WifiologyUser(row.userID, row.emailAddress, row.userName, row.userData, row.passwordData);
}

async function createNewWifiologyUserWithPassword(emailAddress, userName, userData, password, userID=null){
    // Inspired by https://gist.github.com/skeggse/52672ddee97c8efec269

    let salt = await cryptoAsync.randomBytesAsync(saltBytes);
    let hash = await cryptoAsync.pbkdf2Async(
        password, salt, iterations, hashBytes, hashAlgo
    );

    let combined = new Buffer.allocUnsafe(hash.length + salt.length + 8);

    combined.writeUInt32BE(salt.length, 0);
    combined.writeUInt32BE(iterations, 4);
    salt.copy(combined, 8);
    hash.copy(combined, salt.length + 8);

    return new WifiologyUser(userID, emailAddress, userName, userData, combined);
}

module.exports.WifiologyUser = WifiologyUser;
module.exports.wifiologyUserFromRow = wifiologyUserFromRow;
module.exports.createNewWifiologyUserWithPassword = createNewWifiologyUserWithPassword;
