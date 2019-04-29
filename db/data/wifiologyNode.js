const wifiologyNodeQueries = require('../queries/wifiologyNode');
const { createNewWifiologyNodeRecord } = require('../models/wifiologyNode');


async function createNewWifiologyNode(client, nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData){
    let newRecord = createNewWifiologyNodeRecord(nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData);
    newRecord.nodeID = await wifiologyNodeQueries.insertWifiologyNode(client, newRecord);
    return newRecord;
}

async function getWifiologyNodeByID(client, nodeID){
    return await wifiologyNodeQueries.selectWifiologyNodeByID(client, nodeID);
}

async function getWifiologyNodeByName(client, nodeName){
    return await wifiologyNodeQueries.selectWifiologyNodeByName(client, nodeName);
}

async function getWifiologyNodesByOwnerID(client, ownerID){
    return await wifiologyNodeQueries.selectWifiologyNodesByOwnerID(client, ownerID);
}

async function getAllWifiologyNodes(client, limit, offset, executingUser=null){
    let targetUserID = executingUser ? executingUser.userID : null;
    return await wifiologyNodeQueries.selectAllWifiologyNodes(client, limit, offset, targetUserID);
}

async function getAllPublicWifiologyNodes(client, limit, offset){
    return await wifiologyNodeQueries.selectAllPublicWifiologyNodes(client, limit, offset);
}

async function wifiologyNodeHeartbeat(client, nodeID){
    return await wifiologyNodeQueries.updateNodeLastSeen(client, nodeID)
}

async function getNodesAvailableToUser(client, userID, limit, offset){
    return await wifiologyNodeQueries.selectWifiologyNodesVisibleToUser(client, userID, limit, offset);
}

module.exports = {
    createNewWifiologyNode,
    getWifiologyNodeByID,
    getWifiologyNodeByName,
    getWifiologyNodesByOwnerID,
    getAllWifiologyNodes,
    getAllPublicWifiologyNodes,
    wifiologyNodeHeartbeat,
    getNodesAvailableToUser
};