const pg = require('pg');
const named = require('node-postgres-named');
const Sync = require('sync');
const DBMigrate = require('db-migrate');
const path = require('path');


function createPostgresPool(connectionString, ssl=false) {
    return new pg.Pool({
        connectionString,
        ssl
    });
}

async function doMigrationUpAsync(DATABASE_URL){
    let dbmigrate = DBMigrate.getInstance(
        true,
        {
            env:{
                DATABASE_URL
            },
            cmdOptions: {
                "migrations-dir": path.resolve(path.dirname(__dirname), 'migrations')
            }
        }
    );
    await dbmigrate.up();
}


async function doMigrationUpSync(DATABASE_URL){
    return Sync(doMigrationUpAsync(DATABASE_URL));
}


async function spawnClientFromPool(dbPool, beginTransaction=true) {
    let client = await dbPool.connect();
    try {
        named.patch(client);
        if (beginTransaction) {
            await client.query("BEGIN");
        }
        return client;
    }
    catch(e){
        client.release();
        throw e;
    }
}

async function commit(client){
    return await client.query("COMMIT");
}

async function rollback(client){
    return await client.query("ROLLBACK");
}

async function release(client){
    return Promise.resolve(client.release());
}

async function resetDatabase(client){
    await client.query("DROP SCHEMA public cascade;");
    await client.query("CREATE SCHEMA public;");
}

module.exports = {
    createPostgresPool,
    spawnClientFromPool,
    commit,
    rollback,
    release,
    doMigrationUpSync,
    doMigrationUpAsync,
    resetDatabase
};