const HDRHistogramJS = require('hdr-histogram-js');

class WifiologyServiceSetJitterMeasurement {
    constructor(measurementID, serviceSetID, minJitter, maxJitter, avgJitter,
                stdDevJitter, jitterHistogram, jitterHistogramOffset, beaconInterval, extraData) {
        this.measurementID = measurementID;
        this.serviceSetID = serviceSetID;
        this.minJitter = minJitter;
        this.maxJitter = maxJitter;
        this.avgJitter = avgJitter;
        this.stdDevJitter = stdDevJitter;
        this.jitterHistogram = jitterHistogram;
        this.jitterHistogramOffset = jitterHistogramOffset;
        this.beaconInterval = beaconInterval;
        this.extraData = extraData;
    }

    toRow() {
        let row = {
            measurementID: this.measurementID,
            serviceSetID: this.serviceSetID,
            minJitter: this.minJitter,
            maxJitter: this.maxJitter,
            avgJitter: this.avgJitter,
            stdDevJitter: this.stdDevJitter,
            jitterHistogramOffset: this.jitterHistogramOffset,
            beaconInterval: this.beaconInterval,
            extraData: this.extraData
        };
        if(this.jitterHistogram){
            row.jitterHistogram  = HDRHistogramJS.encodeIntoBase64String(this.jitterHistogram);
        } else {
            row.jitterHistogram = null;
        }
        return row;
    }

    toApiResponse() {
        let resp = {
            measurementID: this.measurementID,
            serviceSetID: this.serviceSetID,
            minJitter: this.minJitter,
            maxJitter: this.maxJitter,
            avgJitter: this.avgJitter,
            stdDevJitter: this.stdDevJitter,
            jitterHistogramOffset: this.jitterHistogramOffset,
            beaconInterval: this.beaconInterval,
            extraData: this.extraData
        };
        if(this.jitterHistogram){
            resp.jitterHistogram  = HDRHistogramJS.encodeIntoBase64String(this.jitterHistogram);
        }
        return resp;
    }
}

function fromRow(row) {
    let histogram;
    if(row.jitterhistogram){
        histogram = HDRHistogramJS.decodeFromCompressedBase64(row.jitterhistogram);
    }
    else{
        histogram = null;
    }
    return new WifiologyServiceSetJitterMeasurement(
        row.measurementid, row.servicesetid, row.minjitter, row.maxjitter, row.avgjitter,
        row.stddevjitter, histogram, row.jitterhistogramoffset, row.beaconinterval, row.extradata
    );
}

function fromAPI(apiData, measurementID, serviceSetID){
    let histogram;
    if(apiData.jitterHistogram){
        histogram = HDRHistogramJS.decodeFromCompressedBase64(apiData.jitterHistogram);
    }
    else{
        histogram = null;
    }
    return new WifiologyServiceSetJitterMeasurement(
        measurementID, serviceSetID, apiData.minJitter, apiData.maxJitter, apiData.avgJitter,
        apiData.stdDevJitter, histogram, apiData.jitterHistogramOffset, apiData.beaconInterval, apiData.extraData
    );
}

module.exports = {
    WifiologyServiceSetJitterMeasurement,
    fromRow,
    fromAPI
};
