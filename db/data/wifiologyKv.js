const wifiologyKvQueries = require('../queries/wifiologyKv');


async function getAllKeyValuePairs(client, limit, offset){
    return await wifiologyKvQueries.selectAllKeyValuePairs(client, limit, offset);
}

async function createKeyValuePair(client, key, value){
    return await wifiologyKvQueries.insertKeyValuePair(client, key, value);
}

module.exports = {
    getAllKeyValuePairs,
    createKeyValuePair
};