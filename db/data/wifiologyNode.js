const { insertWifiologyNode, selectAllWifiologyNodes,
    selectWifiologyNodeByID, selectWifiologyNodeByName,
    selectWifiologyNodesByOwnerID} = require('../queries/wifiologyNode');
const { createNewWifiologyNodeRecord } = require('../models/wifiologyNode');


async function createNewWifiologyNode(client, nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData){
    let newRecord = createNewWifiologyNodeRecord(nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData);
    newRecord.nodeID = await insertWifiologyNode(client, newRecord);
    return newRecord;
}

module.exports = {
    createNewWifiologyNode,
};