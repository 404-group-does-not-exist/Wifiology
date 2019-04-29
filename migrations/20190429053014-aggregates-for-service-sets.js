'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(
      `
CREATE OR REPLACE VIEW measurementServiceSet AS 
  SELECT DISTINCT comboTable.measurementID, comboTable.serviceSetID 
  FROM(SELECT measurementID, mapServiceSetID AS serviceSetID FROM infrastructureStationServiceSetMap 
       UNION 
       SELECT measurementID, associatedServiceSetID AS serviceSetID FROM associationStationServiceSetMap) AS comboTable;


CREATE OR REPLACE FUNCTION dataCountersForServiceSetInfraStations(measurementIDs BIGINT[], serviceSetIDs BIGINT[])
  RETURNS TABLE (
    measurementID BIGINT,
    serviceSetID BIGINT,
    managementFrameCount BIGINT,
    associationFrameCount BIGINT,
    reassociationFrameCount BIGINT,
    disassociationFrameCount BIGINT,
    controlFrameCount BIGINT,
    rtsFrameCount BIGINT,
    ctsFrameCount BIGINT,
    ackFrameCount BIGINT,
    dataFrameCount BIGINT,
    dataThroughputIn BIGINT,
    dataThroughputOut BIGINT,
    retryFrameCount BIGINT,
    averagePower REAL,
    stdDevPower REAL,
    lowestRate INTEGER,
    higestRate INTEGER,
    failedFCSCount BIGINT
  )
AS
$body$
BEGIN
RETURN QUERY SELECT
    m.mapMeasurementID AS measurementID,
    i.mapServiceSetID AS serviceSetID,
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
    weightedAverage(
        m.averagePower::REAL,
        (m.managementFrameCount + m.controlFrameCount + m.dataFrameCount)::REAL
    )::REAL AS averagePower,
    weightedStdDev(
        m.stdDevPower::REAL,
        (m.managementFrameCount + m.controlFrameCount + m.dataFrameCount)::REAL
    )::REAL AS stdDevPower,
    MIN(m.lowestRate) AS lowestRate,
    MAX(m.highestRate) AS highestRate,
    SUM(m.failedFCSCount) AS failedFCSCount
FROM measurementstationmap AS m
JOIN infrastructureStationServiceSetMap AS i ON i.measurementID = m.mapMeasurementID AND i.mapStationID = m.mapStationID
GROUP BY m.mapmeasurementid, i.mapServiceSetID
HAVING m.mapmeasurementID = ANY(measurementIDs) AND i.mapServiceSetID = ANY(serviceSetIDs);
END;
$body$
language 'plpgsql';


CREATE OR REPLACE FUNCTION dataCountersForServiceSetAssociatedStations(measurementIDs BIGINT[], serviceSetIDs BIGINT[])
  RETURNS TABLE (
    measurementID BIGINT,
    serviceSetID BIGINT,
    managementFrameCount BIGINT,
    associationFrameCount BIGINT,
    reassociationFrameCount BIGINT,
    disassociationFrameCount BIGINT,
    controlFrameCount BIGINT,
    rtsFrameCount BIGINT,
    ctsFrameCount BIGINT,
    ackFrameCount BIGINT,
    dataFrameCount BIGINT,
    dataThroughputIn BIGINT,
    dataThroughputOut BIGINT,
    retryFrameCount BIGINT,
    averagePower REAL,
    stdDevPower REAL,
    lowestRate INTEGER,
    higestRate INTEGER,
    failedFCSCount BIGINT
  )
AS
$body$
BEGIN
RETURN QUERY SELECT
    m.mapMeasurementID AS measurementID,
    a.associatedServiceSetID AS serviceSetID,
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
    weightedAverage(
        m.averagePower::REAL,
        (m.managementFrameCount + m.controlFrameCount + m.dataFrameCount)::REAL
    )::REAL AS averagePower,
    weightedStdDev(
        m.stdDevPower::REAL,
        (m.managementFrameCount + m.controlFrameCount + m.dataFrameCount)::REAL
    )::REAL AS stdDevPower,
    MIN(m.lowestRate) AS lowestRate,
    MAX(m.highestRate) AS highestRate,
    SUM(m.failedFCSCount) AS failedFCSCount
FROM measurementstationmap AS m
JOIN associationStationServiceSetMap AS a ON a.measurementID = m.mapMeasurementID AND a.associatedStationID = m.mapStationID
GROUP BY m.mapmeasurementid, a.associatedServiceSetID
HAVING m.mapmeasurementID = ANY(measurementIDs) AND a.associatedServiceSetID = ANY(serviceSetIDs);
END;
$body$
language 'plpgsql';      
      `
  );
};

exports.down = function(db) {
  return db.runSql(
      `
      DROP FUNCTION dataCountersForServiceSetInfraStations;
      DROP FUNCTION dataCountersForServiceSetAssociatedStations;
      DROP VIEW measurementServiceSet;
      `
  );
};

exports._meta = {
  "version": 1
};
