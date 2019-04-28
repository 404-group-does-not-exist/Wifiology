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
CREATE TABLE IF NOT EXISTS serviceSetJitterMeasurement(
  measurementID BIGINT NOT NULL REFERENCES measurement(measurementID) ON DELETE CASCADE,
  serviceSetID BIGINT NOT NULL REFERENCES serviceSet(serviceSetID) ON DELETE CASCADE,
  minJitter REAL,
  maxJitter REAL,
  avgJitter REAL,
  stdDevJitter REAL,
  jitterHistogram TEXT,
  jitterHistogramOffset REAL,
  beaconInterval INTEGER,
  extraData JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY(measurementID, serviceSetID)
);
CREATE INDEX IF NOT EXISTS serviceSetJitterMeasurement_measurement_IDX ON serviceSetJitterMeasurement(measurementID);
CREATE INDEX IF NOT EXISTS serviceSetJitterMeasurement_measurement_serviceSet_IDX ON serviceSetJitterMeasurement(measurementID, serviceSetID);
CREATE INDEX IF NOT EXISTS serviceSEtJitterMeasurement_serviceSetIDX ON serviceSEtJitterMeasurement(serviceSetID);      
      `
  );
};

exports.down = function(db) {
  return db.runSql(
      `
DROP TABLE IF EXITS serviceSetJitterMeasurement;      
      `

  );
};

exports._meta = {
  "version": 1
};
