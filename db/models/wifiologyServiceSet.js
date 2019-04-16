class WifiologyServiceSet {
    constructor(serviceSetID, bssid, networkName, extraData) {
        this.serviceSetID = serviceSetID;
        this.bssid = bssid;
        this.networkName = networkName;
        this.extraData = extraData;
    }

    toRow() {
        return {
            serviceSetID: this.serviceSetID,
            bssid: this.bssid,
            networkName: this.networkName,
            extraData: this.extraData
        }
    }

    toApiResponse() {
        return {
            serviceSetID: this.serviceSetID,
            bssid: this.bssid,
            networkName: this.networkName,
            extraData: this.extraData
        }
    }
}

function fromRow(row) {
    return new WifiologyServiceSet(
        row.servicesetid, row.bssid, row.networkname, row.extradata
    );
}

module.exports = {
    WifiologyServiceSet,
    fromRow
};
