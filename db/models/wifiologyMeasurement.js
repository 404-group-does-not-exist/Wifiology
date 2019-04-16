class WifiologyMeasurement {
    constructor(measurementID, measurementNodeID, measurementStartTime,
                measurementEndTime, measurementDuration, channel, averageNoise,
                stdDevNoise, extraData) {
        this.measurementID = measurementID;
        this.measurementNodeID = measurementNodeID;
        this.measurementStartTime = measurementStartTime;
        this.measurementEndTime = measurementEndTime;
        this.measurementDuration = measurementDuration;
        this.channel = channel;
        this.averageNoise = averageNoise;
        this.stdDevNoise = stdDevNoise;
        this.extraData = extraData;
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
}

function fromRow(row) {
    return new WifiologyMeasurement(
        row.measurementid, row.measurementnodeid, row.measurementstarttime,
        row.measurementendtime, row.measurementduration, row.channel,
        row.averagenoise || null, row.stddevnoise || null, row.extradata
    );
}

function dateFromEpochSeconds(es){
    return new Date(es*1000);
}

function fromAPI(apiData, nodeID){
    return new WifiologyMeasurement(
        null, nodeID, dateFromEpochSeconds(apiData.measurementStartTime),
        dateFromEpochSeconds(apiData.measurementEndTime), apiData.measurementDuration,
        apiData.channel, apiData.averageNoise || null, apiData.stdDevNoise || null,
        apiData.extraData
    )
}

module.exports = {
    WifiologyMeasurement,
    fromRow,
    fromAPI
};
