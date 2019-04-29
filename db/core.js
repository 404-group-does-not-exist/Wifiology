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


async function spawnClientFromPool(dbPool,) {
    let client = await dbPool.connect();
    try {
        return client;
    }
    catch(e){
        client.release();
        throw e;
    }
}

async function begin(client){
    return await client.query("BEGIN");
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

async function transactionWrapper(pool, callback){
    const client = await pool.connect();
    let rolledBack = false;
    try {
        named.patch(client);
        await client.query('BEGIN');
        try {
            let result = await callback(client, async function(){ await client.query('ROLLBACK'); rolledBack=true; });
            if(!rolledBack){
                await client.query('COMMIT');
            }
            return result;
        } catch(e) {
            await client.query('ROLLBACK');
            throw e;
        }
    } finally {
        await client.release()
    }
}

async function connectionWrapper(pool, callback){
    const client = await pool.connect();
    try {
        named.patch(client);
        return await callback(client);
    } finally {
        await client.release()
    }
}

async function resetDatabase(client){
    await client.query("DROP SCHEMA IF EXISTS public cascade;");
    await client.query("CREATE SCHEMA public;");
}

module.exports = {
    createPostgresPool,
    spawnClientFromPool,
    begin,
    commit,
    rollback,
    release,
    doMigrationUpSync,
    doMigrationUpAsync,
    resetDatabase,
    transactionWrapper,
    connectionWrapper
};