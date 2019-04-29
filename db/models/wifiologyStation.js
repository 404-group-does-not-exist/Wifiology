class WifiologyStation {
    constructor(stationID, macAddress, extraData, dataCounters=null) {
        this.stationID = stationID;
        this.macAddress = macAddress;
        this.extraData = extraData;
        this.dataCounters = dataCounters;
    }

    toRow() {
        return {
            stationID: this.stationID,
            macAddress: this.macAddress,
            extraData: this.extraData
        }
    }

    toApiResponse() {
        let resp = {
            stationID: this.stationID,
            macAddress: this.macAddress,
            extraData: this.extraData
        };
        if(this.dataCounters){
            resp.dataCounters = this.dataCounters.toApiResponse();
        }
        return resp;
    }
}

function fromRow(row, dataCounters=null) {
    return new WifiologyStation(
        row.stationid, row.macaddress, row.extradata, dataCounters
    );
}

function fromAPI(apiData, dataCounters=null){
    return new WifiologyStation(
       null, apiData.macAddress, apiData.extraData, dataCounters
    );
}

module.exports = {
    WifiologyStation,
    fromRow,
    fromAPI
};
