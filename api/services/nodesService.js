const wifiologyNodeData = require('../../db/data/wifiologyNode');

const { transactionWrapper } = require("../../db/core");

function nodesServiceConstructor(dbPool){
    return  {
        async getAllNodesAPI(limit, offset, user){
            return await transactionWrapper(dbPool, async function(client){
                let nodes = await wifiologyNodeData.getAllWifiologyNodes(client, limit, offset, user);
                return nodes.map(n => n.toApiResponse());
            });
        },
        async createNodeAPI(newNodeData, ownerID){
            return await transactionWrapper(dbPool, async function(client){
                let newNode = await wifiologyNodeData.createNewWifiologyNode(
                    client,
                    newNodeData.nodeName,
                    newNodeData.nodeLocation,
                    newNodeData.nodeDescription,
                    ownerID,
                    newNodeData.isPublic,
                    newNodeData.nodeData
                );
                return newNode.toApiResponse();
            });
        },
        async getNodesForOwnerAPI(ownerID){
            return await transactionWrapper(dbPool, async function(client){
                let nodes = await wifiologyNodeData.getWifiologyNodesByOwnerID(client, ownerID);
                return nodes.map(n => n.toApiResponse());
            });
        }
    };
}

module.exports = nodesServiceConstructor;

