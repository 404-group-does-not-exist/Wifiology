const { generateHashedData, verifyfHashedData } = require('../../util/cryptoPromise');

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

    toApiResponse() {
        return {
            userID: this.userID,
            emailAddress: this.emailAddress,
            userName: this.userName
        }
    }

    async verifyPassword(password) {
        return await verifyfHashedData(password, this.passwordData, hashAlgo);
    }

}

function fromRow(row){
    return new WifiologyUser(row.userid, row.emailaddress, row.username, row.userdata, row.passworddata);
}

async function createNewWifiologyUserWithPassword(emailAddress, userName, userData, password, userID=null){
    let hashedPassData = await generateHashedData(password, hashBytes, saltBytes, iterations, hashAlgo);
    return new WifiologyUser(userID, emailAddress, userName, userData, hashedPassData);
}


module.exports = {
    WifiologyUser,
    fromRow,
    createNewWifiologyUserWithPassword
};