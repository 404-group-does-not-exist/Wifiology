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

module.exports = {
    insertMeasurementStationLink,
    insertServiceSetAssociatedStation,
    insertServiceSetInfraStation,
    updateServiceSetNetworkNameIfNeeded,
    selectWifiologyServiceSetAssociatedMacAddresses,
    selectWifiologyServiceSetInfraMacAddresses
};