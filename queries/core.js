const fs = require('fs');
const path = require('path');

const sqlDirectory = path.join(path.dirname(path.dirname(__filename)), 'sql');

function readSQLFile(fname, dir=sqlDirectory){
    return fs.readFileSync(path.join(dir, fname)).toString('utf-8');
}

const schema = readSQLFile("schema.sql");

async function writeSchemaSync(client){
    return await client.query(schema);
}

module.exports = {
    writeSchema: writeSchemaSync
};