class WifiologyMeasurement {
    constructor(measurementID, measurementNodeID, measurementStartTime,
                measurementEndTime, measurementDuration, channel, averageNoise,
                stdDevNoise, extraData, dataCounters=null) {
        this.measurementID = measurementID;
        this.measurementNodeID = measurementNodeID;
        this.measurementStartTime = measurementStartTime;
        this.measurementEndTime = measurementEndTime;
        this.measurementDuration = measurementDuration;
        this.channel = channel;
        this.averageNoise = averageNoise;
        this.stdDevNoise = stdDevNoise;
        this.extraData = extraData;
        this.dataCounters = dataCounters;
    }

    toRow() {
        return {
            measurementID: this.measurementID,
            measurementNodeID: this.measurementNodeID,
            measurementStartTime: this.measurementStartTime,
            measurementEndTime: this.measurementEndTime,
            measurementDuration: this.measurementDuration,
            channel: this.channel,
            averageNoise: this.averageNoise,
            stdDevNoise: this.stdDevNoise,
            extraData: this.extraData
        }
    }

    toApiResponse() {
        let base_payload = {
            measurementID: this.measurementID,
            measurementNodeID: this.measurementNodeID,
            measurementStartTime: this.measurementStartTime,
            measurementEndTime: this.measurementEndTime,
            measurementDuration: this.measurementDuration,
            channel: this.channel,
            averageNoise: this.averageNoise,
            stdDevNoise: this.stdDevNoise,
            extraData: this.extraData
        };
        if(this.dataCounters){
            base_payload.dataCounters = this.dataCounters.toApiResponse();
        }
        return base_payload;
    }
}

function fromRow(row, dataCounters=null) {
    return new WifiologyMeasurement(
        row.measurementid, row.measurementnodeid, row.measurementstarttime,
        row.measurementendtime, row.measurementduration, row.channel,
        row.averagenoise || null, row.stddevnoise || null,
        row.extradata, dataCounters
    );
}

function dateFromEpochSeconds(es){
    return new Date(es*1000);
}

function fromAPI(apiData, nodeID, dataCounters=null){
    return new WifiologyMeasurement(
        null, nodeID, dateFromEpochSeconds(apiData.measurementStartTime),
        dateFromEpochSeconds(apiData.measurementEndTime), apiData.measurementDuration,
        apiData.channel, apiData.averageNoise || null, apiData.stdDevNoise || null,
        apiData.extraData, dataCounters
    )
}

module.exports = {
    WifiologyMeasurement,
    fromRow,
    fromAPI
};
