const wifiologyUserQueries = require('../queries/wifiologyUser');
const { createNewWifiologyUserWithPassword } = require('../models/wifiologyUser');


async function getUserByUserName(connection, userName){
    return await wifiologyUserQueries.selectWifiologyUserByUserName(connection, userName);
}

async function getUserByID(connection, userID){
    return await wifiologyUserQueries.selectWifiologyUserByID(connection, userID);
}

async function getAllUsers(connection, limit, offset){
    return await wifiologyUserQueries.selectAllWifiologyUsers(connection, limit, offset);
}

async function createNewUser(transaction, emailAddress, userName, password, userData, isAdmin, isActive){
    // TODO: Check if duplicate email or username
    let newUserObject = await createNewWifiologyUserWithPassword(
        emailAddress, userName, userData, password, isAdmin, isActive
    );
    newUserObject.userID = await wifiologyUserQueries.insertWifiologyUser(transaction, newUserObject);
    return newUserObject
}

module.exports ={
    getUserByUserName,
    getUserByID,
    getAllUsers,
    createNewUser
};