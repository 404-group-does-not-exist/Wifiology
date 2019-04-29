const { fromRow, calculateHashForLookup } = require('../models/wifiologyApiKey');
const userFromRow = require('../models/wifiologyUser').fromRow;


async function insertWifiologyApiKey(client, newWifiologyApiKey) {
    let result = await client.query(
        "INSERT INTO wifiologyApiKey(ownerID, apiKeyHash, apiKeyDescription, apiKeyExpiry) VALUES ($ownerID, $apiKeyHash, $apiKeyDescription, $apiKeyExpiry) RETURNING apiKeyID",
        newWifiologyApiKey.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].apikeyid;
    } else {
        return null;
    }
}

async function selectWifiologyApiKeyByApiKeyID(client, apiKeyID){
    let result = await client.query(
        "SELECT * FROM wifiologyApiKey WHERE apiKeyID = $1",
        [apiKeyID]
    );
    if(result.rows.length > 0){
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyApiKeysByOwnerID(client, ownerID){
    let result = await client.query(
        "SELECT * FROM wifiologyApiKey WHERE ownerID = $1",
        [ownerID]
    );
    return result.rows.map(r => fromRow(r));
}

async function selectAllWifiologyApiKeys(client, limit, offset){
    let result = await client.query(
        "SELECT * FROM wifiologyApiKey LIMIT $1 OFFSET $2",
        [limit, offset]
    );
    return result.rows.map(r => fromRow(r));
}

async function selectWifiologyUserByApiKey(client, candidateApiKey){
    let hashedCandidateKey = await calculateHashForLookup(candidateApiKey);
    let result = await client.query(
        `SELECT wUser.* FROM wifiologyUser AS wUser 
         JOIN wifiologyApiKey AS wKey ON wUser.userID = wKey.ownerID WHERE apiKeyHash = $1`,
        [hashedCandidateKey]
    );
    if(result.rows.length > 0){
        return userFromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function deleteWifiologyApiKeyByApiKeyID(client, apiKeyID){
    let result = await client.query(
        "DELETE FROM wifiologyApiKey WHERE apiKeyID = $1 RETURNING apiKeyID",
        [apiKeyID]
    );
    return result.rows.length;
}


module.exports = {
    insertWifiologyApiKey,
    selectAllWifiologyApiKeys,
    selectWifiologyApiKeyByApiKeyID,
    selectWifiologyApiKeysByOwnerID,
    selectWifiologyUserByApiKey,
    deleteWifiologyApiKeyByApiKeyID
};