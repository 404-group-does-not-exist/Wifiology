const pg = require('pg');
const named = require('node-postgres-named');


function createPostgresPool(connectionString, ssl=false) {
    return new pg.Pool({
        connectionString,
        ssl
    });
}


async function spawnClientFromPool(dbPool, beginTransaction=true) {
    let client = await dbPool.connect();
    named.patch(client);
    if(beginTransaction) {
        await client.query("BEGIN");
    }
    return client;
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

module.exports = {
    createPostgresPool,
    spawnClientFromPool,
    commit,
    rollback,
    release
};