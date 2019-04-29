const wifiologyApiKeyData = require('../../db/data/wifiologyApiKey');
const wifiologyUserData = require('../../db/data/wifiologyUser');
const { spawnClientFromPool, commit, release } = require("../../db/core");

function usersServiceConstructor(dbPool){
    return  {
        async getApiKeysForUserAPI(ownerID){
            let client = await spawnClientFromPool(dbPool);
            try {
                let keys = await wifiologyApiKeyData.getApiKeysByOwnerID(client, ownerID);
                let result = keys.map(u => u.toApiResponse());
                await commit(client);
                return result;
            }
            catch(e){
                await release(client);
                throw e;
            }
            finally {
                await release(client);
            }

        },
        async getApiKeyByIDAPI(ownerID, apiKeyID){
            let client = await spawnClientFromPool(dbPool);
            try {
                let key = await wifiologyApiKeyData.getApiKeyByID(client, apiKeyID);
                if(!key){
                    throw {
                        error: "InvalidAPIKeyID",
                        status: 400,
                        message: `No such API Key ID ${apiKeyID}`
                    }
                }
                else if(key.ownerID !== ownerID){
                    throw {
                        error: "UnprivilegedAccess",
                        status: 403,
                        message: `Not allowed ot view API Key ID ${apiKeyID}`
                    }
                }
                let result = key.toApiResponse();
                await commit(client);
                return result;
            }
            catch(e){
                await release(client);
                throw e;
            }
            finally {
                await release(client);
            }

        },
        async createAPIKeyAPI(ownerID, newApiKeyData){
            let client =  await spawnClientFromPool(dbPool);

            try {
                let user = await wifiologyUserData.getUserByID(client, ownerID);
                if(!user){
                    throw {
                        error: "InvalidUserID",
                        status: 400,
                        message: `No such user ID: ${userID}`
                    };
                }

                let newKey = await wifiologyApiKeyData.createNewApiKey(
                    client, ownerID, newApiKeyData.description
                );
                let result = {
                    key: newKey.key,
                    info: newKey.info.toApiResponse()
                };
                await commit(client);
                return result;
            }
            catch(e){
                await release(client);
                throw e;
            }
            finally {
                await release(client);
            }
        },
        async deleteApiKeyByIDAPI(ownerID, apiKeyID){
            let client = await spawnClientFromPool(dbPool);
            try {
                let key = await wifiologyApiKeyData.getApiKeyByID(client, apiKeyID);
                if(!key){
                    throw {
                        error: "InvalidAPIKeyID",
                        status: 400,
                        message: `No such API Key ID ${apiKeyID}`
                    }
                }
                else if(key.ownerID !== ownerID){
                    throw {
                        error: "UnprivilegedAccess",
                        status: 403,
                        message: `Not allowed ot view API Key ID ${apiKeyID}`
                    }
                }
                await wifiologyApiKeyData.deleteApiKey(client, apiKeyID);
                await commit(client);
                return {};
            }
            catch(e){
                await release(client);
                throw e;
            }
            finally {
                await release(client);
            }

        }
    };
}

module.exports = usersServiceConstructor;