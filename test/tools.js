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

function randFloat(lowerBound, upperBound){
    return Number.parseFloat(
        Number.parseFloat((Math.random() * upperBound) + lowerBound).toPrecision(6)
    );
}

function randInt(lowerBound, upperBound){
    return Math.floor((Math.random() * (upperBound - lowerBound)) + lowerBound);
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}


function randBool(threshold){
    return Math.random() < threshold;
}

function randRange(min, max){
    return [...Array(randInt(min, max)).keys()]
}


module.exports = {
    spawnClient,
    randFloat,
    randInt,
    randomChoice,
    randBool,
    randRange
};