const { insertWifiologyNode, selectAllWifiologyNodes,
    selectWifiologyNodeByID, selectWifiologyNodeByName,
    selectWifiologyNodesByOwnerID} = require('../queries/wifiologyNode');
const { createNewWifiologyNodeRecord } = require('../models/wifiologyNode');


async function createNewWifiologyNode(client, nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData){
    let newRecord = createNewWifiologyNodeRecord(nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData);
    newRecord.nodeID = await insertWifiologyNode(client, newRecord);
    return newRecord;
}

async function getWifiologyNodeByID(client, nodeID){
    return await selectWifiologyNodeByID(client, nodeID);
}

async function getWifiologyNodeByName(client, nodeName){
    return await selectWifiologyNodeByName(client, nodeName);
}

async function getWifiologyNodesByOwnerID(client, ownerID){
    return await selectWifiologyNodesByOwnerID(client, ownerID);
}

async function getAllWifiologyNodes(client, limit, offset, executingUser=null){
    let targetUserID = executingUser ? executingUser.userID : null;
    return await selectAllWifiologyNodes(client, limit, offset, targetUserID);
}

module.exports = {
    createNewWifiologyNode,
    getWifiologyNodeByID,
    getWifiologyNodeByName,
    getWifiologyNodesByOwnerID,
    getAllWifiologyNodes
};