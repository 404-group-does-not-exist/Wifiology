const wifiologyUserQueries = require('../queries/wifiologyUser');
const { createNewWifiologyUserWithPassword } = require('../models/wifiologyUser');

const validator = require("email-validator");


async function getUserByUserName(client, userName){
    return await wifiologyUserQueries.selectWifiologyUserByUserName(client, userName);
}

async function getUserByID(client, userID){
    return await wifiologyUserQueries.selectWifiologyUserByID(client, userID);
}

async function getUserByEmailAddress(client, emailAddress){
    return await wifiologyUserQueries.selectWifiologyUserByEmailAddress(client, emailAddress);
}

async function getAllUsers(client, limit, offset){
    return await wifiologyUserQueries.selectAllWifiologyUsers(client, limit, offset);
}

async function createNewUser(transaction, emailAddress, userName, password, userData, isAdmin, isActive,
                             checkEmailAddressValidity=true){
    /*if(checkEmailAddressValidity && !validator.validate(emailAddress)){
        throw {
            error: 'InvalidEmailAddress',
            message: `The email address provided: ${emailAddress} does not appear to be a valid email address.`
            status: 400
        }
    }*/
    let newUserObject = await createNewWifiologyUserWithPassword(
        emailAddress, userName, userData, password, isAdmin, isActive
    );
    newUserObject.userID = await wifiologyUserQueries.insertWifiologyUser(transaction, newUserObject);
    return newUserObject
}

module.exports ={
    getUserByUserName,
    getUserByID,
    getUserByEmailAddress,
    getAllUsers,
    createNewUser
};