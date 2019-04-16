const wifiologyUserData = require('../../db/data/wifiologyUser');
const wifiologyNodeData = require('../../db/data/wifiologyNode');
const wifiologyMeasurementData = require('../../db/data/wifiologyMeasurement');


const { spawnClientFromPool, commit, rollback } = require("../../db/core");

function nodesServiceConstructor(dbPool){
    return  {
        async createNewMeasurementAPI(newMeasurementData, nodeID, userID){
            let client = await spawnClientFromPool(dbPool);
            try {
                let node = await wifiologyNodeData.getWifiologyNodeByID(client, nodeID);

                if(!node){
                    throw {
                        error: 'NoSuchNode',
                        message: `A node with the ID ${nodeID} doesn't exist.`,
                        status: 400
                    }
                }

                if(node.ownerID !== userID){
                    throw {
                        error: 'UnprivilegedError',
                        message: 'This user is not allowed to upload a measurement for this node.',
                        status: 403
                    }
                }
                wifiologyMeasurementData.createNewMeasurement();
                await commit(client);
                return result;
            }
            catch(e){
                await rollback(client);
                throw e;
            }
            finally {
                await client.end();
            }
        }
    };
}

module.exports = nodesServiceConstructor;

