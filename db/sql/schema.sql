-- DIALECT: Postgres

CREATE TABLE IF NOT EXISTS wifiologyUser(
  userID SERIAL NOT NULL PRIMARY KEY,
  emailAddress VARCHAR(256) UNIQUE NOT NULL,
  userName VARCHAR(256) UNIQUE NOT NULL,
  userData JSONB NOT NULL DEFAULT '{}',
  passwordData TEXT NOT NULL
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
    mapStationID BIGINT NOT NULL REFERENCES station(stationID), -- can we use the same name as line 30?
    PRIMARY KEY(mapMeasurementID, mapStationID)
);

-- write select for this one and test it
CREATE TABLE IF NOT EXISTS measurementServiceSetMap(
    mapMeasurementID BIGINT NOT NULL REFERENCES measurement(measurementID), -- can we use the same name as line 36?
    mapServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID),
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
    PRIMARY KEY(mapMeasurementID, mapServiceSetID)
);