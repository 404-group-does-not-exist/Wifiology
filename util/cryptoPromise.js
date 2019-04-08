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

module.exports.pbkdf2Async = pbkdf2Async;
module.exports.randomBytesAsync = randomBytesAsync;