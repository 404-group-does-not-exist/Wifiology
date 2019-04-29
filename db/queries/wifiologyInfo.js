function counterGenerator(primaryKey, tableName){
    return async function(client){
        let result = await client.query(
            `SELECT COUNT(${primaryKey}) AS thecount FROM ${tableName}`
        );
        return result.rows[0].thecount;
    }
}

const selectUserCount = counterGenerator("userID", "wifiologyUser");
const selectNodeCount = counterGenerator("nodeID", "wifiologyNode");
const selectMeasurementCount = counterGenerator("measurementID", "measurement");
const selectServiceSetCount = counterGenerator("serviceSetID", "serviceSet");
const selectStationCount = counterGenerator("stationID", "station");


async function selectDatabaseInfo(client){
    return {
        userCount: await selectUserCount(client),
        nodeCount: await selectNodeCount(client),
        measurementCount: await selectMeasurementCount(client),
        serviceSetCount: await selectServiceSetCount(client),
        stationCount: await selectStationCount(client)
    }
}

module.exports = {
  selectDatabaseInfo,
  selectUserCount,
  selectNodeCount,
  selectMeasurementCount,
  selectServiceSetCount,
  selectStationCount
};