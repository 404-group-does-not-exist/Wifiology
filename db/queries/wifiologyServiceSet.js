const { fromRow } = require('../models/wifiologyServiceSet');

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


/* TODO: Both hard and inaccurate any ways.
async function selectAggregateDataCountersForServiceSetMeasurements(client, measurementID, serviceSetID){
    let queryString = `
    SELECT 
        mapStationID,
        SUM(m.managementFrameCount) AS managementFrameCount,
        SUM(m.associationFrameCount) AS associationFrameCount,
        SUM(m.reassociationFrameCount) AS reassociationFrameCount,
        SUM(m.disassociationFrameCount) AS disassociationFrameCount,
        SUM(m.controlFrameCount) AS controlFrameCount,
        SUM(m.rtsFrameCount) AS rtsFrameCount,
        SUM(m.ctsFrameCount) AS ctsFrameCount,
        SUM(m.ackFrameCount) AS ackFrameCount,
        SUM(m.dataFrameCount) AS dataFrameCount,
        SUM(m.dataThroughputIn) AS dataThroughputIn,
        SUM(m.dataThroughputOut) AS dataThroughputOut,
        SUM(m.retryFrameCount) AS retryFrameCount,
        null AS averagePower, -- TODO: weighted average support
        null AS stdDevPower, -- TODO: weighted variance support
        MIN(m.lowestRate) AS lowestRate,
        MAX(m.highestRate) AS highestRate,
        SUM(m.failedFCSCount) AS failedFCSCount
    FROM measurementStationMap AS m    
    GROUP BY m.mapmeasurementid
    HAVING m.mapmeasurementid IN 
    ` + placeholderConstructor(measurementIDs);
    let result = await client.query(
        queryString,
        measurementIDs
    );
    if(result.rows.length > 0){
        return result.rows.reduce((acc, row) => {
            acc[row.mapmeasurementid] = dataCountersFromRow(row);
            return acc;
        }, {});
    } else {
        return null;
    }

}*/

module.exports = {
    insertWifiologyServiceSet,
    selectWifiologyServiceSetByBssid,
    selectWifiologyServiceSetByServiceSetID,
    selectWifiologyServiceSetsByMeasurementID
};