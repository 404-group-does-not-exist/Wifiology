const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const { WifiologyServiceSetJitterMeasurement, fromAPI, fromRow} =
    require("../../../../db/models/wifiologyServiceSetJitterMeasurement");
const HDRHistogramJS = require('hdr-histogram-js');


describe('WifiologyServiceSetJitterMeasurement', function(){
    function keysToLowerCase(obj){
        // Taken from: https://stackoverflow.com/questions/12539574/whats-the-best-way-most-efficient-to-turn-all-the-keys-of-an-object-to-lower
        let key, keys = Object.keys(obj);
        let n = keys.length;
        let newobj= {};
        while (n--) {
            key = keys[n];
            newobj[key.toLowerCase()] = obj[key];
        }
        return newobj;
    }

    it("should successfully decode valid HDR histogram payloads", function(){
       let result = fromAPI(
           {
               minJitter: 1.0,
               maxJitter: 2.0,
               avgJitter: 1.5,
               stdDevJitter: 0.25,
               jitterHistogram: "HISTFAAAACB4nJNpmSzMwMDAwQABjGh0CozPyMTE5MvEzgQARRICFQ==",
               jitterHistogramOffset: 100000,
               beaconInterval: 100,
               extraData: {}
           },
           1,
           2
       );
       expect(result.jitterHistogram).to.be.an.instanceOf(HDRHistogramJS.AbstractHistogram);
       expect(result.jitterHistogram.getStdDeviation()).to.be.within(28, 29);
       expect(result.jitterHistogram.totalCount).to.be.eql(5);
       expect(result.jitterHistogram.minNonZeroValue).to.be.within(1, 5);
       expect(result.jitterHistogram.maxValue).to.be.within(64, 68);
    });

    it("using toRow and fromRow together should match the identity funciton", function(){
        let result = fromAPI(
            {
                minJitter: 1.0,
                maxJitter: 2.0,
                avgJitter: 1.5,
                stdDevJitter: 0.25,
                jitterHistogram: "HISTFAAAACB4nJNpmSzMwMDAwQABjGh0CozPyMTE5MvEzgQARRICFQ==",
                jitterHistogramOffset: 100000,
                beaconInterval: 100,
                extraData: {}
            },
            1,
            2
        );
        let newResult = fromRow(keysToLowerCase(result.toRow()));
        expect(newResult.jitterHistogram).to.be.an.instanceOf(HDRHistogramJS.AbstractHistogram);
        expect(newResult.jitterHistogram.getStdDeviation()).to.be.within(28, 29);
        expect(newResult.jitterHistogram.totalCount).to.be.eql(5);
        expect(newResult.jitterHistogram.minNonZeroValue).to.be.within(1, 5);
        expect(newResult.jitterHistogram.maxValue).to.be.within(64, 68);
    });
});