const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const {
    pbkdf2Async,
    randomBytesAsync,
    randomHexStringAsync,
    generateHashedData,
    verifyfHashedData
} = require('../../../util/cryptoPromise');


describe('crypto async/promise utils', function(){
   it('should provide workable pbdkdf2 support that works with async/await', async function(){
       let promise = pbkdf2Async('foo', 'bar', 1, 8, 'md5');
       expect(promise).to.be.instanceOf(Promise);
       let result = await promise;
       expect(result).to.be.instanceOf(Buffer);
       expect(result).to.be.length(8);
   });

   it('should provide a reasonably decent random bytes generator', async function(){
        let resultSet = new Set();
        let promise = randomBytesAsync(16);
        expect(promise).to.be.instanceOf(Promise);
        let result = await promise;
        expect(result).to.be.instanceOf(Buffer);
        expect(result).to.be.length(16);
        resultSet.add(result);

        for(let i = 0; i < 50; i++){
            // Verify that repeated calls to the random string generator do not generate duplicates
            // This is a weak check of randomness, but at least it's a baseline.
            let r = await randomBytesAsync(16);
            expect(r).to.be.length(16);
            expect(r).to.be.instanceOf(Buffer);
            resultSet.add(r);
            expect(resultSet.size).to.be.eql(i+2);
       }

    });

   it('should provide a reasonably decent random hex string generator', async function(){
       let resultSet = new Set();
       let promise = randomHexStringAsync(16);
       expect(promise).to.be.instanceOf(Promise);
       let result = await promise;
       expect(result).to.be.a('string');
       expect(result).to.be.length(16);
       resultSet.add(result);

       for(let i = 0; i < 50; i++){
           // Again, weak check of randomness, but something of a baseline
           let r = await randomHexStringAsync(16);
           expect(r).to.be.length(16);
           expect(r).to.be.a('string');
           resultSet.add(r);
           expect(resultSet.size).to.be.eql(i+2);
       }
   });

   it('should provide a way to hash data in a database friendly format', async function(){
        let promise = generateHashedData('foobarbaz', 16, 8, 10, 'sha512');
        expect(promise).to.be.instanceOf(Promise);
        let result = await promise;
        expect(result.length).to.be.gt(24);
        expect(result).to.be.a('string');
   });

   it('should provide a way to verify hashed data', async function(){
       let hash = await generateHashedData('foobarbaz', 16, 8, 10, 'sha512');
       let promise = verifyfHashedData('foobarbaz', hash, 'sha512');
       expect(promise).to.be.instanceOf(Promise);
       let result = await promise;
       let result2 = await verifyfHashedData('password', hash, 'sha512');
       expect(result).to.be.true;
       expect(result2).to.not.be.true;
   });

});