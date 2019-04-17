const crypto = require('crypto');


// Stolen from: https://stackoverflow.com/questions/49717731/error-no-callback-provided-to-pbkdf2-when-using-async-await
function pbkdf2Async(password, salt, iterations, keylen, digest) {
    return new Promise( (res, rej) => {
        crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, key) => {
            err ? rej(err) : res(key);
        });
    });
}

function randomBytesAsync(size) {
    return new Promise( (res, rej) => {
        crypto.randomBytes(size, (err, result) => {
            err ? rej(err) : res(result);
        });
    });
}

function randomHexStringAsync(size) {
    return new Promise((res, rej) => {
       crypto.randomBytes(size/2, (err, result) => {
          err ? rej(err): res(result.toString('hex'))
       });
    });
}


async function generateHashedData(value, hashBytes, saltBytes, iterations, hashAlgo, salt=null){
    // Inspired by https://gist.github.com/skeggse/52672ddee97c8efec269

    if(salt === null){
        salt = await randomBytesAsync(saltBytes);
    }
    let hash = await pbkdf2Async(
        value, salt, iterations, hashBytes, hashAlgo
    );

    let hashInformation = new Buffer.allocUnsafe(hash.length + salt.length + 8);
    hashInformation.writeUInt32BE(salt.length, 0);
    hashInformation.writeUInt32BE(iterations, 4);
    salt.copy(hashInformation, 8);
    hash.copy(hashInformation, salt.length + 8);
    return hashInformation.toString('base64');
}

async function verifyfHashedData(candidateValue, hashedData, hashAlgo) {
    let rawPassData = new Buffer.from(hashedData, 'base64');
    let saltBytes = rawPassData.readUInt32BE(0);
    let hashBytes = rawPassData.length - saltBytes - 8;
    let iterations = rawPassData.readUInt32BE(4);
    let salt = rawPassData.slice(8, saltBytes + 8);
    let hash = rawPassData.toString('binary', saltBytes + 8);

    // verify the salt and hash against the password
    let testHash =  await pbkdf2Async(candidateValue, salt, iterations, hashBytes, hashAlgo);
    return testHash.toString('binary') === hash;
}

module.exports = {
    pbkdf2Async,
    randomBytesAsync,
    randomHexStringAsync,
    generateHashedData,
    verifyfHashedData
};
