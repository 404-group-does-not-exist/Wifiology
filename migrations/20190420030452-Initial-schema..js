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
-- DIALECT: Postgres

CREATE TABLE IF NOT EXISTS wifiologyUser(
  userID SERIAL NOT NULL PRIMARY KEY,
  emailAddress VARCHAR(256) UNIQUE NOT NULL,
  userName VARCHAR(256) UNIQUE NOT NULL,
  userData JSONB NOT NULL DEFAULT '{}',
  passwordData TEXT NOT NULL,
  isAdmin BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS wifiologyApiKey(
  apiKeyID SERIAL NOT NULL PRIMARY KEY,
  ownerID INTEGER NOT NULL REFERENCES wifiologyUser(userID),
  apiKeyHash TEXT NOT NULL,
  apiKeyDescription VARCHAR(4096) NOT NULL,
  apiKeyExpiry TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS wifiologyNode(
  nodeID SERIAL NOT NULL PRIMARY KEY,
  nodeName VARCHAR(256) UNIQUE NOT NULL,
  nodeLastSeenTime TIMESTAMP WITH TIME ZONE NULL,
  nodeLocation VARCHAR(500) NOT NULL,
  nodeDescription VARCHAR(8000) NOT NULL,
  ownerID INTEGER REFERENCES wifiologyUser(userID),
  isPublic BOOLEAN DEFAULT FALSE,
  nodeData JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS wifiologyNodeOwnerID_IDX ON wifiologyNode(ownerID);

CREATE TABLE IF NOT EXISTS measurement(
    measurementID BIGSERIAL NOT NULL PRIMARY KEY,
    measurementNodeID INTEGER NOT NULL REFERENCES wifiologyNode(nodeID),
    measurementStartTime TIMESTAMP WITH TIME ZONE NOT NULL,
    measurementEndTime TIMESTAMP WITH TIME ZONE NOT NULL,
    measurementDuration REAL NOT NULL,
    channel INTEGER NOT NULL,
    averageNoise REAL,
    stdDevNoise REAL,
    extraData JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS measurement_channel_startTime_IDX ON measurement(channel, measurementStartTime);


CREATE TABLE IF NOT EXISTS station(
    stationID BIGSERIAL NOT NULL PRIMARY KEY,
    macAddress TEXT UNIQUE NOT NULL,
    extraData JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS serviceSet(
    serviceSetID BIGSERIAL NOT NULL PRIMARY KEY,
    bssid VARCHAR(64) UNIQUE NOT NULL,
    networkName TEXT,
    extraData JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS infrastructureStationServiceSetMap(
     mapStationID BIGINT NOT NULL REFERENCES station(stationID),
     mapServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID),
     PRIMARY KEY(mapStationID, mapServiceSetID)
);

CREATE TABLE IF NOT EXISTS associationStationServiceSetMap(
    associatedStationID BIGINT NOT NULL REFERENCES station(stationID),
    associatedServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID),
    PRIMARY KEY(associatedStationID, associatedServiceSetID)
);

CREATE TABLE IF NOT EXISTS measurementStationMap(
    mapMeasurementID BIGINT NOT NULL REFERENCES measurement(measurementID),
    mapStationID BIGINT NOT NULL REFERENCES station(stationID),
    managementFrameCount INTEGER NOT NULL DEFAULT 0,
    associationFrameCount INTEGER NOT NULL DEFAULT 0,
    reassociationFrameCount INTEGER NOT NULL DEFAULT 0,
    disassociationFrameCount INTEGER NOT NULL DEFAULT 0,
    controlFrameCount INTEGER NOT NULL DEFAULT 0,
    rtsFrameCount INTEGER NOT NULL DEFAULT 0,
    ctsFrameCount INTEGER NOT NULL DEFAULT 0,
    ackFrameCount INTEGER NOT NULL DEFAULT 0,
    dataFrameCount INTEGER NOT NULL DEFAULT 0,
    dataThroughputIn INTEGER NOT NULL DEFAULT 0,
    dataThroughputOut INTEGER NOT NULL DEFAULT 0,
    retryFrameCount INTEGER NOT NULL DEFAULT 0,
    averagePower REAL,
    stdDevPower REAL,
    lowestRate INTEGER,
    highestRate INTEGER,
    failedFCSCount INTEGER,
    PRIMARY KEY(mapMeasurementID, mapStationID)
);

-- write select for this one and test it
CREATE TABLE IF NOT EXISTS measurementServiceSetMap(
    mapMeasurementID BIGINT NOT NULL REFERENCES measurement(measurementID), -- can we use the same name as line 36?
    mapServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID),
    PRIMARY KEY(mapMeasurementID, mapServiceSetID)
);

CREATE TABLE IF NOT EXISTS featureFlag(
    featureFlagKey VARCHAR(512) NOT NULL PRIMARY KEY,
    featureFlagValue JSONB NOT NULL
);


--
--
--  STORED PROCEDURES BELOW
--
--



CREATE OR REPLACE FUNCTION weightedAverage_sfunc(aggState point, avg REAL, weight REAL)
  RETURNS point
  AS $body$
  BEGIN
    IF (avg IS NOT NULL) AND (weight IS NOT NULL) THEN
       RETURN point(aggState[0] + avg*weight, aggState[1] + weight);
    ELSE
       RETURN aggState;
    END IF;
  END;
$body$
LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION weightedAverage_finalfunc(aggState point)
  RETURNS REAL
  AS $body$
  begin
    IF(aggState[1] = 0) THEN
        RETURN NULL;
    ELSE
        return aggState[0]/aggState[1];
    END IF;
  end;
$body$
language 'plpgsql';

DROP AGGREGATE IF EXISTS weightedAverage(REAL, REAL);
CREATE AGGREGATE weightedAverage(avg REAL, weight REAL)(
    initcond = '(0.0, 0.0)',
    sfunc = weightedAverage_sfunc,
    stype = point,
    finalfunc = weightedAverage_finalfunc
);

CREATE OR REPLACE FUNCTION weightedStdDev_sfunc(aggState point, stdDev REAL, weight REAL)
  RETURNS point
  AS $body$
  BEGIN
    IF (stdDev IS NOT NULL) AND (weight IS NOT NULL) THEN
       RETURN point(aggState[0] + stdDev*stdDev*weight, aggState[1] + weight);
    ELSE
       RETURN aggState;
    END IF;
  END;
$body$
LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION weightedStdDev_finalfunc(aggState point)
  RETURNS REAL
  AS $body$
  begin
    IF(aggState[1] = 0) THEN
        RETURN NULL;
    ELSE
        return sqrt(aggState[0]/aggState[1]);
    END IF;
  end;
$body$
language 'plpgsql';

DROP AGGREGATE IF EXISTS weightedStdDev(REAL, REAL);
CREATE AGGREGATE weightedStdDev(stdDev REAL, weight REAL)(
    initcond = '(0.0, 0.0)',
    sfunc = weightedStdDev_sfunc,
    stype = point,
    finalfunc = weightedStdDev_finalfunc
);

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
language 'plpgsql';      
      `,
      []
  );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
