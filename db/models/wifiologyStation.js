class WifiologyStation {
    constructor(stationID, macAddress, extraData) {
        this.stationID = stationID;
        this.macAddress = macAddress;
        this.extraData = extraData;
    }

    toRow() {
        return {
            stationID: this.stationID,
            macAddress: this.macAddress,
            extraData: this.extraData
        }
    }

    toApiResponse() {
        return {
            stationID: this.stationID,
            macAddress: this.macAddress,
            extraData: this.extraData
        }
    }
}

function fromRow(row) {
    return new WifiologyStation(
        row.stationid, row.macaddress, row.extradata
    );
}

module.exports = {
    WifiologyStation,
    fromRow
};
