const wifiologyApiKeyQueries = require('../queries/wifiologyApiKey');
const { createNewApiKeyRecord } = require('../models/wifiologyApiKey');
const { randomHexStringAsync} = require('../../util/cryptoPromise');


async function getUserByApiKey(client, apiKey) {
    return await wifiologyApiKeyQueries.selectWifiologyUserByApiKey(client, apiKey);
}

async function getApiKeyByID(client, apiKeyID) {
    return await wifiologyApiKeyQueries.selectWifiologyApiKeyByApiKeyID(client, apiKeyID);
}

async function getApiKeysByOwnerID(client, ownerID) {
    return await wifiologyApiKeyQueries.selectWifiologyApiKeysByOwnerID(client, ownerID);
}

async function createNewApiKey(client, ownerID, description){
    // TODO: Check if duplicate email or username
    let newApiKey = await randomHexStringAsync(64);
    let newApiKeyObject = await createNewApiKeyRecord(ownerID, newApiKey, description);
    newApiKeyObject.apiKeyID = await wifiologyApiKeyQueries.insertWifiologyApiKey(client, newApiKeyObject);
    return {
        key: newApiKey,
        info: newApiKeyObject
    };
}

async function deleteApiKey(client, apiKeyID){
    return await wifiologyApiKeyQueries.deleteWifiologyApiKeyByApiKeyID(client, apiKeyID);
}

module.exports = {
    getUserByApiKey,
    getApiKeyByID,
    getApiKeysByOwnerID,
    createNewApiKey,
    deleteApiKey
};