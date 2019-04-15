const wifiologyKvData = require('../../db/data/wifiologyKv');
const { spawnClientFromPool, commit } = require("../../db/core");

function kvServiceConstructor(dbPool){
    return  {
        async getAllKeyValuePairsAPI(limit, offset){
            let client = await spawnClientFromPool(dbPool);
            try {
                let kvs = await wifiologyKvData.getAllKeyValuePairs(client, limit, offset);
                //let result = kvs.map(u => u.toApiResponse());
                await commit(client);
                return kvs;
            }
            finally {
                await client.end();
            }

        },
        async createKeyValuePairAPI(newKvData){
            let client =  await spawnClientFromPool(dbPool);

            try {
                await wifiologyKvData.createKeyValuePair(
                    client,
                    newKvData.keyName,
                    newKvData.value
                );
                //let result = newUser.toApiResponse();
                await commit(client);
                return {};
            }
            finally {
                await client.end();
            }
        }
    };
}

module.exports = kvServiceConstructor;

