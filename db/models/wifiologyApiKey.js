const { generateHashedData, verifyfHashedData } = require('../../util/cryptoPromise');

const hashBytes = 64;
const saltBytes = 16;
const iterations = 10000;
const hashAlgo = 'sha512';
const fixedSalt = true;
const fixedSaltValue = new Buffer.from("1hzgF8KRiNZ3hmEV");

class WifiologyApiKey {
    constructor(apiKeyID, ownerID, apiKeyHash, apiKeyDescription, apiKeyExpiry) {
        this.apiKeyID = apiKeyID;
        this.ownerID = ownerID;
        this.apiKeyHash = apiKeyHash;
        this.apiKeyDescription = apiKeyDescription;
        this.apiKeyExpiry = apiKeyExpiry;
    }

    toRow() {
        return {
            apiKeyID: this.apiKeyID,
            ownerID: this.ownerID,
            apiKeyHash: this.apiKeyHash,
            apiKeyDescription: this.apiKeyDescription,
            apiKeyExpiry: this.apiKeyExpiry
        }
    }

    toApiResponse() {
        return {
            apiKeyID: this.apiKeyID,
            ownerID: this.ownerID,
            apiKeyDescription: this.apiKeyDescription,
            apiKeyExpiry: this.apiKeyExpiry
        }
    }

    async verifyHash(key) {
        return await verifyfHashedData(key, this.apiKeyHash, hashAlgo);
    }

}

function fromRow(row) {
    return new WifiologyApiKey(row.apikeyid, row.ownerid, row.apikeyhash, row.apikeydescription, row.apikeyexpiry);
}

async function createNewApiKeyRecord(ownerID, apiKey, description, expiry=null){
    let salt = null;
    if(fixedSalt){
        salt = fixedSaltValue;
    }
    let hashedKeyData = await generateHashedData(apiKey, hashBytes, saltBytes, iterations, hashAlgo, salt);
    return new WifiologyApiKey(null, ownerID, hashedKeyData, description, expiry);
}

async function calculateHashForLookup(candidateApiKey){
    let salt = null;
    if(fixedSalt){
        salt = fixedSaltValue;
    }
    return await generateHashedData(candidateApiKey, hashBytes, saltBytes, iterations, hashAlgo, salt);
}




module.exports = {
    WifiologyApiKey,
    fromRow,
    createNewApiKeyRecord,
    calculateHashForLookup
};