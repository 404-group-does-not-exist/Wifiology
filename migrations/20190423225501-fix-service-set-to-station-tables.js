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
    
      ALTER TABLE infrastructureStationServiceSetMap RENAME TO infrastructureStationServiceSetMapOld;
      ALTER TABLE associationStationServiceSetMap RENAME TO associationStationServiceSetMapOld;

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

      INSERT INTO infrastructureStationServiceSetMap(
        mapStationID, mapServiceSetID, measurementID
      ) SELECT io.mapStationID, io.mapServiceSetID, mss.mapMeasurementID
      FROM infrastructureStationServiceSetMapOld AS io
      CROSS JOIN measurementServiceSetMap AS mss
      WHERE mss.mapServiceSetID = io.mapServiceSetID;
      
      INSERT INTO associationStationServiceSetMap(
        associatedStationID, associatedServiceSetID, measurementID
      ) SELECT ao.associatedStationID, ao.associatedServiceSetID, mss.mapMeasurementID
      FROM associationStationServiceSetMapOld AS ao
      CROSS JOIN measurementServiceSetMap AS mss
      WHERE mss.mapServiceSetID = ao.associatedServiceSetID;

      DROP TABLE IF EXISTS measurementServiceSetMap;
      DROP TABLE IF EXISTS infrastructureStationServiceSetMapOld;
      DROP TABLE IF EXISTS associationStationServiceSetMapOld;

      CREATE INDEX IF NOT EXISTS measurementStationMap_measurement_IDX ON measurementStationMap(mapMeasurementID);
      
      ALTER TABLE measurementStationMap 
        DROP CONSTRAINT measurementstationmap_mapmeasurementid_fkey,
        DROP CONSTRAINT measurementstationmap_mapstationid_fkey,
        ADD CONSTRAINT measurementstationmap_mapmeasurementid_fkey FOREIGN KEY(mapMeasurementID) REFERENCES measurement(measurementID) ON DELETE CASCADE,
        ADD CONSTRAINT measurementstationmap_mapstationid_fkey FOREIGN KEY(mapStationID) REFERENCES station(stationID) ON DELETE CASCADE;
      `
  );
};

exports.down = function(db) {
  return db.runSql(
      `
      DROP INDEX IF EXISTS measurementStationMap_measurement_IDX;
      DROP INDEX IF EXISTS measurement_node_startTime_IDX;
      DROP INDEX IF EXISTS measurment_node_channel_startTime_UNIQUE_IDX;
      
      ALTER TABLE infrastructureStationServiceSetMap RENAME TO infrastructureStationServiceSetMapFuture;
      ALTER TABLE associationStationServiceSetMap RENAME TO associationStationServiceSetMapFuture;

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
      
      CREATE TABLE IF NOT EXISTS measurementServiceSetMap(
         mapMeasurementID BIGINT NOT NULL REFERENCES measurement(measurementID), -- can we use the same name as line 36?
         mapServiceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID),
         PRIMARY KEY(mapMeasurementID, mapServiceSetID)
      );
      
      INSERT INTO infrastructureStationServiceSetMap(
        mapStationID, mapServiceSetID, measurementID
      ) SELECT DISTINCT if.mapStationID, if.mapServiceSetID
      FROM infrastructureStationServiceSetMapFuture AS if;
     
      
      INSERT INTO associationStationServiceSetMap(
        associatedStationID, associatedServiceSetID, measurementID
      ) SELECT DISTINCT af.associatedStationID, af.associatedServiceSetID, mss.measurementID
      FROM associationStationServiceSetMapFuture AS af;
      
      INSERT INTO measurementServiceSetMap(
         mapMeasurementID, mapServiceSetID
      ) SELECT DISTINCT T.mID, T.ssID FROM (
        SELECT DISTINCT measurementID AS mID, associatedServiceSetID AS ssID
        FROM associationStationServiceSetMapFuture
        UNION ALL
        SELECT DISTINCT measurementID AS mID, mapServiceSetID AS ssID
        FROM infrastructureStationServiceSetMapFuture
      ) T;
      
      DROP TABLE IF EXISTS infrastructureStationServiceSetMapFuture;
      DROP TABLE IF EXISTS associationStationServiceSetMapFuture;
      
      ALTER TABLE measurementStationMap 
        DROP CONSTRAINT measurementstationmap_mapmeasurementid_fkey,
        DROP CONSTRAINT measurementstationmap_mapstationid_fkey,
        ADD CONSTRAINT measurementstationmap_mapmeasurementid_fkey FOREIGN KEY(mapMeasurementID) REFERENCES measurement(measurementID),
        ADD CONSTRAINT measurementstationmap_mapstationid_fkey FOREIGN KEY(mapStationID) REFERENCES station(stationID);
      `
  );
};

exports._meta = {
  "version": 1
};
