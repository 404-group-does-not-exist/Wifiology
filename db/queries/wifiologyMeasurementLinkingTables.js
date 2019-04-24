async function insertMeasurementStationLink(client, measurementID, stationID, dataCounters){
    let params = {stationID, measurementID};

    await client.query(
        `INSERT INTO measurementStationMap(
            mapMeasurementID, mapStationID, managementFrameCount,
            associationFrameCount, reassociationFrameCount, disassociationFrameCount,
            controlFrameCount, rtsFrameCount, ctsFrameCount, ackFrameCount,
            dataFrameCount, dataThroughputIn, dataThroughputOut,
            retryFrameCount, averagePower, stdDevPower, lowestRate, highestRate,
            failedFCSCount
        ) VALUES (
            $measurementID, $stationID, $managementFrameCount,
            $associationFrameCount, $reassociationFrameCount, $disassociationFrameCount,
            $controlFrameCount, $rtsFrameCount, $ctsFrameCount, $ackFrameCount,
            $dataFrameCount, $dataThroughputIn, $dataThroughputOut,
            $retryFrameCount, $averagePower, $stdDevPower, $lowestRate, $highestRate,
            $failedFCSCount
        )`,
        {...params, ...dataCounters.toRow()}
    );

}

async function insertServiceSetAssociatedStation(client, measurementID, serviceSetID, stationMacAddress){
    await client.query(
        `INSERT INTO associationStationServiceSetMap(
           measurementID, associatedStationID, associatedServiceSetID
        ) SELECT $measurementID, s.stationID, $serviceSetID 
        FROM station AS s
        WHERE s.macAddress = $stationMacAddress`,
        {measurementID, serviceSetID, stationMacAddress}
    )
}

async function insertServiceSetInfraStation(client, measurementID, serviceSetID, stationMacAddress){
    await client.query(
        `INSERT INTO infrastructureStationServiceSetMap(
          measurementID, mapStationID, mapServiceSetID
        ) SELECT $measurementID, s.stationID, $serviceSetID 
        FROM station AS s
        WHERE s.macAddress = $stationMacAddress`,
        {measurementID, serviceSetID, stationMacAddress}
    )
}

async function updateServiceSetNetworkNameIfNeeded(client, bssid, networkName){
    await client.query(
        `UPDATE serviceSet 
         SET networkName = $networkName 
         WHERE bssid = $bssid AND networkName != $networkName`,
        {bssid, networkName}
    )
}

async function selectWifiologyServiceSetAssociatedMacAddresses(client, measurementID, serviceSetID){
    let result = await client.query(
        `SELECT s.macAddress 
         FROM station AS s 
         JOIN associationStationServiceSetMap AS a ON s.stationid = a.associatedstationid
         WHERE a.associatedServiceSetID = $serviceSetID AND a.measurementID = $measurementID
        `,
        {measurementID, serviceSetID}
    );
    return result.rows;
}

async function selectWifiologyServiceSetInfraMacAddresses(client, measurementID, serviceSetID){
    let result = await client.query(
        `SELECT s.macAddress 
         FROM station AS s
         JOIN infrastructureStationServiceSetMap AS i ON s.stationid = i.mapstationid
         WHERE i.mapServiceSetID = $serviceSetID AND i.measurementID = $measurementID
        `,
        {measurementID, serviceSetID}
    );
    return result.rows;
}

async function selectAggregateWifiologyServiceSetAssociatedMacAddresses(client, measurementID, serviceSetIDs){
    let result = await client.query(
        `SELECT s.macAddress, a.associatedServiceSetID
         FROM station AS s 
         JOIN associationStationServiceSetMap AS a ON s.stationid = a.associatedstationid
         WHERE a.associatedServiceSetID = ANY($serviceSetIDs) AND a.measurementID = $measurementID
        `,
        {measurementID, serviceSetIDs}
    );
    return result.rows.reduce((acc, row) => {
        if(row.associatedservicesetid in acc){
            acc[row.associatedservicesetid].push(row.macaddress);
        } else {
            acc[row.associatedservicesetid] = [row.macaddress];
        }
        acc[row.associatedservicesetid] = row.featureflagvalue;
        return acc;
    }, {});
}

async function selectAggregateWifiologyServiceSetInfraMacAddresses(client, measurementID, serviceSetIDs){
    let result = await client.query(
        `SELECT s.macAddress, i.mapServiceSetID
         FROM station AS s
         JOIN infrastructureStationServiceSetMap AS i ON s.stationid = i.mapstationid
         WHERE i.mapServiceSetID = ANY($serviceSetIDs) AND i.measurementID = $measurementID
        `,
        {measurementID, serviceSetIDs}
    );
    return result.rows.reduce((acc, row) => {
        if(row.mapservicesetid in acc){
            acc[row.mapservicesetid].push(row.macaddress);
        } else {
            acc[row.mapservicesetid] = [row.macaddress];
        }
        return acc;
    }, {});
}

module.exports = {
    insertMeasurementStationLink,
    insertServiceSetAssociatedStation,
    insertServiceSetInfraStation,
    updateServiceSetNetworkNameIfNeeded,
    selectWifiologyServiceSetAssociatedMacAddresses,
    selectWifiologyServiceSetInfraMacAddresses,
    selectAggregateWifiologyServiceSetAssociatedMacAddresses,
    selectAggregateWifiologyServiceSetInfraMacAddresses
};