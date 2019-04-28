class WifiologyServiceSet {
    constructor(serviceSetID, bssid, networkName, extraData, infraMacAddresses=null,
                associatedMacAddresses=null, jitterMeasurement=null) {
        this.serviceSetID = serviceSetID;
        this.bssid = bssid;
        this.networkName = networkName;
        this.extraData = extraData;
        this.infraMacAddresses = infraMacAddresses;
        this.associatedMacAddresses = associatedMacAddresses;
        this.jitterMeasurement = jitterMeasurement;
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
        let resp = {
            serviceSetID: this.serviceSetID,
            bssid: this.bssid,
            networkName: this.networkName,
            extraData: this.extraData
        };
        if(this.infraMacAddresses){
            resp.infrastructureMacAddresses = this.infraMacAddresses;
        }
        if(this.associatedMacAddresses){
            resp.associatedMacAddresses = this.associatedMacAddresses;
        }
        if(this.jitterMeasurement){
            resp.jitterMeasurement = this.jitterMeasurement.toApiResponse();
        }
        return resp;
    }
}

function fromRow(row, infraMacAddresses=null, associatedMacAddresses=null, jitterMeasurement=null) {
    return new WifiologyServiceSet(
        row.servicesetid, row.bssid, row.networkname, row.extradata, infraMacAddresses,
        associatedMacAddresses, jitterMeasurement
    );
}

function fromAPI(apiData, infraMacAddresses=null, associatedMacAddresses=null, jitterMeasurement=null){
    return new WifiologyServiceSet(
        null, apiData.bssid, apiData.networkName, apiData.extraData,
        infraMacAddresses, associatedMacAddresses, jitterMeasurement
    )
}

module.exports = {
    WifiologyServiceSet,
    fromRow,
    fromAPI
};
