const { fromRow } = require('../models/wifiologyServiceSet');
const dataCountersFromRow = require('../models/wifiologyDataCounters').fromRow;

async function insertWifiologyServiceSet(client, newWifiologyServiceSet) {
    let result = await client.query(
        `INSERT INTO serviceset(
           bssid, networkname, extradata
        ) VALUES (
          $bssid, $networkName, $extraData
        ) RETURNING servicesetid`,
        newWifiologyServiceSet.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].servicesetid;
    } else {
        return null;
    }
}

async function selectWifiologyServiceSetByBssid(client, bssid) {
    let result = await client.query(
        `SELECT * FROM serviceSet WHERE bssid = $1`,
        [bssid]
    );
    if(result.rows.length > 0) {
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyServiceSetByServiceSetID(client, serviceSetID) {
    let result = await client.query(
        `SELECT * FROM serviceSet WHERE serviceSetID = $1`,
        [serviceSetID]
    );
    if(result.rows.length > 0) {
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

async function selectWifiologyServiceSetsByMeasurementID(client, measurementID) {
    let result = await client.query(
        `SELECT DISTINCT ss.*
         FROM serviceSet AS ss
         WHERE EXISTS(
           SELECT 1 FROM associationStationServiceSetMap AS a
           WHERE  ss.serviceSetID = a.associatedServiceSetID AND a.measurementID = $measurementID
           UNION ALL
           SELECT 1 FROM infrastructureStationServiceSetMap as i
           WHERE ss.serviceSetID = i.mapServiceSetID AND i.measurementID = $measurementID
           
         )  
        `,
        {measurementID}
    );
    return result.rows.map(r => fromRow(r))
}

async function selectInfraDataCountersForMeasurementsAndServiceSets(client, measurementIDs, serviceSetIDs){
    let result = await client.query(
        `SELECT * FROM dataCountersForServiceSetInfraStations($measurementIDs, $serviceSetIDs)`,
        {measurementIDs, serviceSetIDs}
    );
    if(result.rows.length > 0){
        return result.rows.reduce((acc, row) => {
            if(!acc.hasOwnProperty(row.servicesetid)){
                acc[row.servicesetid] = {};
            }
            acc[row.servicesetid][row.measurementid] = dataCountersFromRow(row);
            return acc;
        }, {});
    } else {
        return null;
    }
}

async function selectAssociatedStationDataCountersForMeasurementsAndServiceSets(client, measurementIDs, serviceSetIDs){
    let result = await client.query(
        `SELECT * FROM dataCountersForServiceSetAssociatedStations($measurementIDs, $serviceSetIDs)`,
        {measurementIDs, serviceSetIDs}
    );
    if(result.rows.length > 0){
        return result.rows.reduce((acc, row) => {
            if(!acc.hasOwnProperty(row.servicesetid)){
                acc[row.servicesetid] = {};
            }
            acc[row.servicesetid][row.measurementid] = dataCountersFromRow(row);
            return acc;
        }, {});
    } else {
        return null;
    }
}

async function selectDistinctServiceSetsByNodeIDs(client, nodeIDs){
    if(nodeIDs && nodeIDs.length > 0){
        let result = await client.query(
            `SELECT DISTINCT ss.*, m.measurementNodeID FROM serviceSet AS ss
             JOIN measurementServiceSet AS mss ON ss.serviceSetID = mss.serviceSetID
             JOIN measurement AS m ON mss.measurementID = m.measurementID
             WHERE m.measurementNodeID = ANY($nodeIDs)
             `,
            {nodeIDs}
        );
        return result.rows.reduce(function(acc, row){
            if(!acc.hasOwnProperty(row.measurementnodeid)){
                acc[row.measurementnodeid] = []
            }
            acc[row.measurementnodeid].push(fromRow(row));
            return acc;
        }, {});
    } else {
        return {}
    }
}


module.exports = {
    insertWifiologyServiceSet,
    selectWifiologyServiceSetByBssid,
    selectWifiologyServiceSetByServiceSetID,
    selectWifiologyServiceSetsByMeasurementID,
    selectInfraDataCountersForMeasurementsAndServiceSets,
    selectAssociatedStationDataCountersForMeasurementsAndServiceSets,
    selectDistinctServiceSetsByNodeIDs
};