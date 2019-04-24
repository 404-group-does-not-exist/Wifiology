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
      CREATE INDEX IF NOT EXISTS measurement_node_startTime_IDX ON measurement(measurementNodeID, measurementStartTime);
      CREATE UNIQUE INDEX IF NOT EXISTS measurment_node_channel_startTime_UNIQUE_IDX ON measurement(measurementNodeID, channel, measurementStartTime);
    
      DROP TABLE IF EXISTS infrastructureStationServiceSetMap;
      DROP TABLE IF EXISTS associationStationServiceSetMap;

      CREATE TABLE IF NOT EXISTS infrastructureStationServiceSetMap(
         mapStationID BIGINT NOT NULL REFERENCES station(stationID) ON DELETE CASCADE,
         mapServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID) ON DELETE CASCADE,
         measurementID BIGINT NOT NULL REFERENCES measurement(measurementID) ON DELETE CASCADE,
         PRIMARY KEY(mapStationID, mapServiceSetID, measurementID)
      );
      CREATE INDEX IF NOT EXISTS infrastructureStationServiceSetMap_measurement_IDX ON infrastructureStationServiceSetMap(measurementID);
      CREATE INDEX IF NOT EXISTS infrastructureStationServiceSetMap_measurement_serviceSet_IDX ON infrastructureStationServiceSetMap(measurementID, mapServiceSetID);

      CREATE TABLE IF NOT EXISTS associationStationServiceSetMap(
          associatedStationID BIGINT NOT NULL REFERENCES station(stationID) ON DELETE CASCADE,
          associatedServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID) ON DELETE CASCADE,
          measurementID BIGINT NOT NULL REFERENCES measurement(measurementID) ON DELETE CASCADE,
          PRIMARY KEY(associatedStationID, associatedServiceSetID, measurementID)
      );
      CREATE INDEX IF NOT EXISTS associationStationServiceSetMap_measurement_IDX ON associationStationServiceSetMap(measurementID);
      CREATE INDEX IF NOT EXISTS associationStationServiceSetMap_measurement_serviceSet_IDX ON associationStationServiceSetMap(measurementID, associatedServiceSetID);

      CREATE INDEX IF NOT EXISTS measurementStationMap_measurement_IDX ON measurementStationMap(mapMeasurementID);
      `
  );
};

exports.down = function(db) {
  return db.runSql(
      `
      DROP INDEX IF EXISTS measurementStationMap_measurement_IDX;
      DROP INDEX IF EXISTS measurement_node_startTime_IDX;
      DROP INDEX IF EXISTS measurment_node_channel_startTime_UNIQUE_IDX;
      DROP TABLE IF EXISTS infrastructureStationServiceSetMap;
      DROP TABLE IF EXISTS associationStationServiceSetMap;

      CREATE TABLE IF NOT EXISTS infrastructureStationServiceSetMap(
         mapStationID BIGINT NOT NULL REFERENCES station(stationID),
         mapServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID),
         PRIMARY KEY (mapStationID, mapServiceSetID)
      );

      CREATE TABLE IF NOT EXISTS associationStationServiceSetMap(
        associatedStationID BIGINT NOT NULL REFERENCES station(stationID),
        associatedServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID),
        PRIMARY KEY (associatedStationID, associatedServiceSetID)
      );
      `
  );
};

exports._meta = {
  "version": 1
};
