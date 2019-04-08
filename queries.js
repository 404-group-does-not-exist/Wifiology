const fs = require('fs');
const path = require('path');

const sqlDirectory = path.join(path.dirname(filename), 'sql');

function readSQLFile(fname, dir=sqlDirectory){
    return fs.readFileSync(os.path.join(dir, fname));
}

function writeSchemaSync(client){
    return client.query(readSQLFile("schema.sql"));
}