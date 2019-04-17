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

function placeholderConstructor(arr){
    let placeholderString = " ( ";
    for(let index in arr){
        let num = parseInt(index) + 1;
        if(num === 1){
            placeholderString = placeholderString.concat(`$${num}`);
        }
        else {
            placeholderString = placeholderString.concat(`, $${num}`);
        }
    }
    return placeholderString.concat(" ) ");
}

module.exports = {
    writeSchema: writeSchemaSync,
    placeholderConstructor
};