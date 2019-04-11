const pg = require('pg');
const named = require('node-postgres-named');

async function spawnClient(databaseUrl){
    let dbClient = new pg.Client({
        connectionString: databaseUrl
    });
    named.patch(dbClient);
    await dbClient.connect();
    return dbClient
}

module.exports = {
    spawnClient
};