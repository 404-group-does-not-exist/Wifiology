const wifiologyUserData = require('../../db/data/wifiologyUser');
const { transactionWrapper } = require("../../db/core");

function usersServiceConstructor(dbPool){
    return  {
        async getAllUsersAPI(limit, offset){
            return await transactionWrapper(dbPool, async function(client){
                let users = await wifiologyUserData.getAllUsers(client, limit, offset);
                return users.map(u => u.toApiResponse());
            });
        },
        async getUserByIDAPI(userID){
            return await transactionWrapper(dbPool, async function(client){
                let user = await wifiologyUserData.getUserByID(client, userID);
                if(user){
                    return user.toApiResponse();
                }
                else {
                    throw {
                        error: "InvalidUserID",
                        status: 400,
                        message: `No such user ID: ${userID}`
                    };
                }
            });
        },
        async createUserAPI(newUserData, featureFlags, remoteAddr=null){
            return await transactionWrapper(dbPool, async function(client){
                let newUser = await wifiologyUserData.createNewUser(
                    client,
                    newUserData.emailAddress,
                    newUserData.userName,
                    newUserData.password,
                    {
                        createdThrough: 'API',
                        createdByIP: remoteAddr,
                        createTime: (new Date()).toISOString(),
                        description: newUserData.description || "",
                        userSince: (new Date()).toLocaleString()
                    },
                    false,
                    await featureFlags.getFlag("users/autoActivate", client, true)
                );
                return newUser.toApiResponse();
            });
        }
    };
}

module.exports = usersServiceConstructor;

