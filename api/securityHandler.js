const basicAuth = require('basic-auth');
const { getUserByUserName } = require('../db/data/wifiologyUser');
const { getUserByApiKey } = require('../db/data/wifiologyApiKey');
const { spawnClientFromPool} = require('../db/core');


function securityAuthHandlerConstructor(dbPool){
    async function BasicAuth(req, scopes, definition){
        let user = basicAuth(req);

        if(!user){
            return Promise.resolve(false);
        }

        let client = await spawnClientFromPool(dbPool);
        let retrievedUser = await getUserByUserName(client, user.name);
        await client.end();

        if(retrievedUser && await retrievedUser.verifyPassword(user.pass)){
            req.user = retrievedUser;
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
    }

    async function ApiKeyAuth(req, scopes, definitions) {
        let apiKey = req.header('X-API-Key');
        if(!apiKey){
            return Promise.resolve(false);
        }
        let client = await spawnClientFromPool(dbPool);
        let retrievedUser = await getUserByApiKey(client, apiKey);
        await client.end();

        if(retrievedUser){
            req.user = retrievedUser;
            return Promise.resolve(true);
        }
        else {
            return Promise.resolve(false);
        }
    }

    return {
        BasicAuth,
        ApiKeyAuth
    }
}

module.exports = securityAuthHandlerConstructor;
