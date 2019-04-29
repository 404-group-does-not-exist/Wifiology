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
DROP FUNCTION dataCountersForMeasurements(BIGINT[]);      
CREATE OR REPLACE FUNCTION dataCountersForMeasurements(measurementIDs BIGINT[])
  RETURNS TABLE (
        measurementID BIGINT,
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
    mapMeasurementID AS measurementID,
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
GROUP BY m.mapmeasurementid
HAVING m.mapmeasurementID = ANY(measurementIDs);
END;
$body$
language 'plpgsql';  
      `
  );
};

exports.down = function(db) {
  return db.runSql(
      `
DROP FUNCTION dataCountersForMeasurements(BIGINT[]);       
CREATE OR REPLACE FUNCTION dataCountersForMeasurements(measurementIDs BIGINT[])
  RETURNS TABLE (
        measurementID BIGINT,
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
        retryCount BIGINT,
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
    mapMeasurementID AS measurementID,
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
GROUP BY m.mapmeasurementid
HAVING m.mapmeasurementID = ANY(measurementIDs);
END;
$body$
language 'plpgsql';  `
  );
};

exports._meta = {
  "version": 1
};
