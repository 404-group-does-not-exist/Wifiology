const wifiologyApiKeyData = require('../../db/data/wifiologyApiKey');
const wifiologyUserData = require('../../db/data/wifiologyUser');
const { transactionWrapper } = require("../../db/core");

function usersServiceConstructor(dbPool){
    return  {
        async getApiKeysForUserAPI(ownerID){
            return await transactionWrapper(dbPool, async function(client){
                let keys = await wifiologyApiKeyData.getApiKeysByOwnerID(client, ownerID);
                return keys.map(u => u.toApiResponse());
            });
        },
        async getApiKeyByIDAPI(ownerID, apiKeyID){
            return await transactionWrapper(dbPool, async function(client){
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
                return key.toApiResponse();
            });
        },
        async createAPIKeyAPI(ownerID, newApiKeyData){
            return await transactionWrapper(dbPool, async function(client){
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
                return {
                    key: newKey.key,
                    info: newKey.info.toApiResponse()
                };

            });
        },
        async deleteApiKeyByIDAPI(ownerID, apiKeyID){
            return await transactionWrapper(dbPool, async function(client){
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
                return {};
            });
        }
    };
}

module.exports = usersServiceConstructor;