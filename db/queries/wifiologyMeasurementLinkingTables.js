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

async function insertMeasurementServiceSet(client, measurementID, serviceSetID){
    await client.query(
        `INSERT INTO measurementServiceSetMap(
            mapMeasurementID, mapServiceSetID
        ) VALUES (
            $measurementID, $serviceSetID
        )`,
        {measurementID, serviceSetID}
    )
}

async function insertServiceSetAssociatedStation(client, serviceSetID, stationMacAddress){
    await client.query(
        `INSERT INTO associationStationServiceSetMap(
           associatedStationID, associatedServiceSetID
        ) SELECT s.stationID, $serviceSetID 
        FROM station AS s
        WHERE s.macAddress = $stationMacAddress`,
        {serviceSetID, stationMacAddress}
    )
}

async function insertServiceSetInfraStation(client, serviceSetID, stationMacAddress){
    await client.query(
        `INSERT INTO infrastructureStationServiceSetMap(
           mapStationID, mapServiceSetID
        ) SELECT s.stationID, $serviceSetID 
        FROM station AS s
        WHERE s.macAddress = $stationMacAddress`,
        {serviceSetID, stationMacAddress}
    )
}

module.exports = {
    insertMeasurementStationLink,
    insertMeasurementServiceSet,
    insertServiceSetAssociatedStation,
    insertServiceSetInfraStation
};