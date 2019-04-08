const fromRow = require('../models/wifiologyUser').wifiologyUserFromRow;

async function insertWifiologyUser(client, newWifiologyUser) {
    let result = await client.query(
        "INSERT INTO wifiologyUser(emailAddress, userName, userData, passwordData) " +
        "VALUES ($emailAddress, $userName, $userData, $passwordData) " +
        "RETURNING userID",
        newWifiologyUser.toRow()
    );
    if(result.rows){
        return result.rows[0].userid;
    } else {
        return null;
    }
}

async function selectWifiologyUserByID(client, userID){
    let result = await client.query(
        "SELECT * FROM wifiologyUser WHERE userID = $1",
        [userID]
    );
    if(result.rows){
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectAllWifiologyUsers(client, limit, offset) {
    let result = await client.query(
        "SELECT * FROM wifiologyUser ORDER BY userID LIMIT $1 OFFSET $2",
        [limit, offset]
    );
    if(result.rows){
      return result.rows.map(fromRow);
    } else {
        return [];
    }
}


module.exports = {
    insertWifiologyUser,
    selectWifiologyUserByID,
    selectAllWifiologyUsers
};