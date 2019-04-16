class WifiologyDataCounters {
    constructor(managementFrameCount, associationFrameCount, reassociationFrameCount, disassociationFrameCount,
                controlFrameCount, rtsFrameCount, ctsFrameCount, ackFrameCount, dataFrameCount,
                dataThroughputIn, dataThroughputOut, retryFrameCount, averagePower, stdDevPower,
                lowestRate, highestRate, failedFCSCount) {
        this.managementFrameCount = managementFrameCount;
        this.associationFrameCount = associationFrameCount;
        this.reassociationFrameCount = reassociationFrameCount;
        this.disassociationFrameCount = disassociationFrameCount;
        this.controlFrameCount = controlFrameCount;
        this.rtsFrameCount = rtsFrameCount;
        this.ctsFrameCount = ctsFrameCount;
        this.ackFrameCount = ackFrameCount;
        this.dataFrameCount = dataFrameCount;
        this.dataThroughputIn = dataThroughputIn;
        this.dataThroughputOut = dataThroughputOut;
        this.retryFrameCount = retryFrameCount;
        this.averagePower = averagePower;
        this.stdDevPower = stdDevPower;
        this.lowestRate = lowestRate;
        this.highestRate = highestRate;
        this.failedFCSCount = failedFCSCount;
    }

    toRow() {
        return {
            managementFrameCount: this.managementFrameCount,
            associationFrameCount: this.associationFrameCount,
            reassociationFrameCount: this.reassociationFrameCount,
            disassociationFrameCount: this.disassociationFrameCount,
            controlFrameCount: this.controlFrameCount,
            rtsFrameCount: this.rtsFrameCount,
            ctsFrameCount: this.ctsFrameCount,
            ackFrameCount: this.ackFrameCount,
            dataFrameCount: this.dataFrameCount,
            dataThroughputIn: this.dataThroughputIn,
            dataThroughputOut: this.dataThroughputOut,
            retryFrameCount: this.retryFrameCount,
            averagePower: this.averagePower,
            stdDevPower: this.stdDevPower,
            lowestRate: this.lowestRate,
            highestRate: this.highestRate,
            failedFCSCount: this.failedFCSCount
        }
    }

    toApiResponse() {
        return {
            managementFrameCount: this.managementFrameCount,
            associationFrameCount: this.associationFrameCount,
            reassociationFrameCount: this.reassociationFrameCount,
            disassociationFrameCount: this.disassociationFrameCount,
            controlFrameCount: this.controlFrameCount,
            rtsFrameCount: this.rtsFrameCount,
            ctsFrameCount: this.ctsFrameCount,
            ackFrameCount: this.ackFrameCount,
            dataFrameCount: this.dataFrameCount,
            dataThroughputIn: this.dataThroughputIn,
            dataThroughputOut: this.dataThroughputOut,
            retryFrameCount: this.retryFrameCount,
            averagePower: this.averagePower,
            stdDevPower: this.stdDevPower,
            lowestRate: this.lowestRate,
            highestRate: this.highestRate,
            failedFCSCount: this.failedFCSCount
        }
    }
}

function fromRow(row) {
    return new WifiologyDataCounters(
        row.managementframecount, row.associationframecount, row.reassociationframecount,
        row.disassociationframecount, row.controlframecount, row.rtsframecount,
        row.ctsframecount, row.ackframecount, row.dataframecount, row.datathroughputin,
        row.datathroughputout, row.retryframecount, row.averagepower, row.stddevpower,
        row.lowestrate, row.highestrate, row.failedfcscount
    );
}

function fromAPI(apiData) {
    return new WifiologyDataCounters(
        apiData.managementFrameCount, apiData.associationFrameCount,
        apiData.reassociationFrameCount, apiData.disassociationFrameCount,
        apiData.controlFrameCount, apiData.rtsFrameCount,
        apiData.ctsFrameCount, apiData.ackFrameCount,
        apiData.dataFrameCount, apiData.dataThroughputIn,
        apiData.dataThroughputOut, apiData.retryFrameCount,
        apiData.averagePower, apiData.stdDevPower,
        apiData.lowestRate, apiData.highestRate,
        apiData.failedFCSCount
    )
}

function zero(){
    return new WifiologyDataCounters(
        0, 0, 0,
        0, 0, 0,
        0,0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    )
}

module.exports = {
    WifiologyDataCounters,
    fromRow,
    fromAPI,
    zero
};
