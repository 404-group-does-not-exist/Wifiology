const winston = require('winston');
const Sync = require('sync');

const { createPostgresPool, doMigrationUpAsync, transactionWrapper } = require('./db/core');
const { FeatureFlags } = require('./db/data/featureFlags');
const { cleanUpOldWifiologyMeasurements } = require('./db/data/wifiologyMeasurement');

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1/wifiology";
let AUTOMIGRATE;
if(process.env.AUTOMIGRATE){
    AUTOMIGRATE = process.env.AUTOMIGRATE === 'true';
} else {
    AUTOMIGRATE = true;
}
let MAX_AGE_DAYS;
if(process.env.MAX_AGE_DAYS){
    MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS);
} else {
    MAX_AGE_DAYS = 28;
}

function runJanitorialDuties(databaseUrl, autoMigrate, maxAgeDays){
    Sync(async function(){
        await doMigrationUpAsync(databaseUrl);
        let pool = createPostgresPool(databaseUrl, true);
        let featureFlags = new FeatureFlags(pool);

        return await transactionWrapper(pool, async function(client){
            if(await featureFlags.getFlag("janitor/cleanUpOldMeasurements", client, true)){
                winston.info("Cleaning up old measurements");
                await cleanUpOldWifiologyMeasurements(client, maxAgeDays);
                winston.info("Clean up done.");
            }
            winston.info("Janitorial duties completed.");
        });
    });
}


if (require.main === module) {
    winston.add(new winston.transports.Console({
        format: winston.format.simple(),
        timestamp: true
    }));
    winston.info("Starting janitorial duties..");
    runJanitorialDuties(DATABASE_URL, AUTOMIGRATE, MAX_AGE_DAYS);
}

module.exports = {
    runJanitorialDuties
};