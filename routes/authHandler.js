const { getUserByUserName } = require('../db/data/wifiologyUser');
const { spawnClientFromPool} = require('../db/core');


function authHandlerConstructor(dbPool){
    async function handleAuth(username, password, done){
        let client = await spawnClientFromPool(dbPool);
        try{
            let user = await getUserByUserName(client, username);
            if(!user){
                return done(null, false, {message: "No such user or invalid password."});
            }
            else if(user.verifyPassword(password)) {
                return done(null, user);
            }
            else {
                return done(null, false, {message: "No such user or invalid password."});
            }

        }
        catch(e){
            return done(e);
        }
        finally {
            client.end();
        }
    }
    return handleAuth;
}

module.exports = authHandlerConstructor;
