const wifiologyUserData = require('../../db/data/wifiologyUser');
const wifiologyNodeData = require('../../db/data/wifiologyNode');
const wifiologyMeasurementData = require('../../db/data/wifiologyMeasurement');

const { spawnClientFromPool, commit, rollback, release } = require("../../db/core");

function nodesServiceConstructor(dbPool){
    return  {
        async createNewMeasurementAPI(newMeasurementData, nodeID, userID){
            let client = await spawnClientFromPool(dbPool);
            let statusCode = 200;
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
                let finalResult;

                let existingMeasurement = await wifiologyMeasurementData.getWifiologyMeasurementDuplicate(
                    client, newMeasurementData,  nodeID
                );
                if(existingMeasurement){
                    finalResult = {
                        warning: 'Measurement Already Exists',
                        measurement: existingMeasurement.toApiResponse()
                    };
                    statusCode = 303;
                } else{
                    let result = await wifiologyMeasurementData.loadNewMeasurementData(client, newMeasurementData, nodeID);
                    finalResult = {
                        measurement: result.newMeasurement.toApiResponse(),
                        stations: result.stations.map(s => s.toApiResponse()),
                        serviceSets: result.serviceSets.map(ss => ss.toApiResponse())
                    };
                }


                await commit(client);
                return {result: finalResult, statusCode};
            }
            catch(e){
                await rollback(client);
                throw e;
            }
            finally {
                await release(client);
            }
        },
        async getNodeMeasurementDataSetsAPI(nodeID, channel, limit, lastPriorMeasurementID, userID){
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

                if(node.ownerID !== userID && !node.isPublic){
                    throw {
                        error: 'UnprivilegedError',
                        message: 'This user is not allowed to see measurements for this node.',
                        status: 403
                    }
                }
                let results;
                if(!channel){
                    results = await wifiologyMeasurementData.getMeasurementDataSetsByNodeID(
                        client, nodeID, limit, lastPriorMeasurementID
                    );
                }
                else {
                    results = await wifiologyMeasurementData.getMeasurementDataSetsByNodeIDAndChannel(
                        client, nodeID, channel, limit, lastPriorMeasurementID
                    );
                }

                await commit(client);
                return results.map(wifiologyMeasurementData.measurementDataSetToApiResponse)
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

