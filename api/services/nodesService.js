const wifiologyNodeData = require('../../db/data/wifiologyNode');

const { spawnClientFromPool, commit, rollback, release } = require("../../db/core");

function nodesServiceConstructor(dbPool){
    return  {
        async getAllNodesAPI(limit, offset, user){
            let client = await spawnClientFromPool(dbPool);
            try {
                let nodes = await wifiologyNodeData.getAllWifiologyNodes(client, limit, offset, user);
                let result = nodes.map(n => n.toApiResponse());
                await commit(client);
                return result;
            }
            catch(e){
                await rollback(client);
                throw e;
            }
            finally {
                await release(client);
            }

        },
        async createNodeAPI(newNodeData, ownerID){
            let client =  await spawnClientFromPool(dbPool);

            try {
                let newNode = await wifiologyNodeData.createNewWifiologyNode(
                    client,
                    newNodeData.nodeName,
                    newNodeData.nodeLocation,
                    newNodeData.nodeDescription,
                    ownerID,
                    newNodeData.isPublic,
                    newNodeData.nodeData
                );
                let result = newNode.toApiResponse();
                await commit(client);
                return result;
            }
            catch(e){
                await rollback(client);
                throw e;
            }
            finally {
                await release(client);
            }
        },
        async getNodesForOwnerAPI(ownerID){
            let client = await spawnClientFromPool(dbPool);
            try {
                let nodes = await wifiologyNodeData.getWifiologyNodesByOwnerID(client, ownerID);
                let result = nodes.map(n => n.toApiResponse());
                await commit(client);
                return result;
            }
            catch(e){
                await rollback(client);
                throw e;
            }
            finally {
                await release(client);
            }
        }
    };
}

module.exports = nodesServiceConstructor;

