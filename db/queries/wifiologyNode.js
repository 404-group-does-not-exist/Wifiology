const { fromRow } = require('../models/wifiologyNode');

async function insertWifiologyNode(client, newWifiologyNode) {
    let result = await client.query(
        "INSERT INTO wifiologyNode(nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData) " +
        "VALUES ($nodeName, $nodeLocation, $nodeDescription, $ownerID, $isPublic, $nodeData) " +
        "RETURNING nodeID",
        newWifiologyNode.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].nodeid;
    } else {
        return null;
    }
}

async function selectWifiologyNodeByID(client, nodeID){
    let result = await client.query(
        "SELECT * FROM wifiologyNode WHERE nodeID = $1",
        [nodeID]
    );
    if(result.rows.length > 0){
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyNodeByName(client, nodeName){
    let result = await client.query(
        "SELECT * FROM wifiologyNode WHERE nodeName = $1",
        [nodeName]
    );
    if(result.rows.length > 0){
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyNodesByOwnerID(client, ownerID){
    let result = await client.query(
        "SELECT * FROM wifiologyNode WHERE ownerID = $1",
        [ownerID]
    );
    return result.rows.map(r => fromRow(r));
}

async function selectAllWifiologyNodes(client, limit, offset, filterUserID=null){
    let baseQuery = "SELECT * FROM wifiologyNode";
    let params = {limit, offset};
    if(filterUserID !== null){
        baseQuery += " WHERE isPublic = TRUE OR ownerID = $filterUserID";
        params.filterUserID = filterUserID;
    }
    baseQuery += " LIMIT $limit OFFSET $offset";

    let result = await client.query(
        baseQuery,
        params
    );
    return result.rows.map(r => fromRow(r));
}


module.exports = {
    insertWifiologyNode,
    selectWifiologyNodeByID,
    selectWifiologyNodeByName,
    selectWifiologyNodesByOwnerID,
    selectAllWifiologyNodes
};
