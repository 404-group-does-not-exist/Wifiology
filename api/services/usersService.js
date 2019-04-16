const wifiologyUserData = require('../../db/data/wifiologyUser');
const { spawnClientFromPool, commit, release } = require("../../db/core");

function usersServiceConstructor(dbPool){
    return  {
        async getAllUsersAPI(limit, offset){
            let client = await spawnClientFromPool(dbPool);
            try {
                let users = await wifiologyUserData.getAllUsers(client, limit, offset);
                let result = users.map(u => u.toApiResponse());
                await commit(client);
                return result;
            }
            finally {
                await release(client);
            }

        },
        async getUserByIDAPI(userID){
            let client = await spawnClientFromPool(dbPool);
            try {
                let user = await wifiologyUserData.getUserByID(client, userID);
                let result;
                if(user){
                    result = user.toApiResponse();
                    await commit(client);
                    return result;
                }
                else {
                    throw {
                        error: "InvalidUserID",
                        status: 400,
                        message: `No such user ID: ${userID}`
                    };
                }

            }
            finally {
                await release(client);
            }
        },
        async createUserAPI(newUserData){
            let client =  await spawnClientFromPool(dbPool);

            try {
                let newUser = await wifiologyUserData.createNewUser(
                    client,
                    newUserData.emailAddress,
                    newUserData.userName,
                    newUserData.password,
                    {description: newUserData.description || ""}
                );
                let result = newUser.toApiResponse();
                await commit(client);
                return result;
            }
            finally {
                await release(client);
            }
        }
    };
}

module.exports = usersServiceConstructor;

