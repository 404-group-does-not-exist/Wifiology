const { generateHashedData, verifyfHashedData } = require('../../util/cryptoPromise');

const hashBytes = 64;
const saltBytes = 16;
const iterations = 10000;
const hashAlgo = 'sha512';

class WifiologyUser {
    constructor(userID, emailAddress, userName, userData, passwordData, isAdmin, isActive) {
        this.userID = userID;
        this.emailAddress = emailAddress;
        this.userName = userName;
        this.userData = userData;
        this.passwordData = passwordData;
        this.isAdmin = isAdmin;
        this.isActive = isActive;
    }

    toRow() {
        return {
            userID: this.userID,
            emailAddress: this.emailAddress,
            userName: this.userName,
            userData: this.userData,
            passwordData: this.passwordData,
            isAdmin: this.isAdmin,
            isActive: this.isActive
        }
    }

    toApiResponse() {
        return {
            userID: this.userID,
            emailAddress: this.emailAddress,
            userName: this.userName,
            isAdmin: this.isAdmin,
            isActive: this.isActive
        }
    }

    async verifyPassword(password) {
        return await verifyfHashedData(password, this.passwordData, hashAlgo);
    }

}

function fromRow(row){
    return new WifiologyUser(
        row.userid, row.emailaddress, row.username, row.userdata, row.passworddata, row.isadmin, row.isactive
    );
}

async function createNewWifiologyUserWithPassword(emailAddress, userName, userData, password,
                                                  isAdmin=false, isActive=false, userID=null){
    let hashedPassData = await generateHashedData(password, hashBytes, saltBytes, iterations, hashAlgo);
    return new WifiologyUser(userID, emailAddress, userName, userData, hashedPassData, isAdmin, isActive);
}


module.exports = {
    WifiologyUser,
    fromRow,
    createNewWifiologyUserWithPassword
};