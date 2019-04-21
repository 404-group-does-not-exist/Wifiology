class WifiologyServiceSet {
    constructor(serviceSetID, bssid, networkName, extraData, infraMacAddresses=null, associatedMacAddresses=null) {
        this.serviceSetID = serviceSetID;
        this.bssid = bssid;
        this.networkName = networkName;
        this.extraData = extraData;
        this.infraMacAddresses = infraMacAddresses;
        this.associatedMacAddresses = associatedMacAddresses
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
        return resp;
    }
}

function fromRow(row, infraMacAddresses=null, associatedMacAddresses=null) {
    return new WifiologyServiceSet(
        row.servicesetid, row.bssid, row.networkname, row.extradata, infraMacAddresses, associatedMacAddresses
    );
}

function fromAPI(apiData, infraMacAddresses=null, associatedMacAddresses=null){
    return new WifiologyServiceSet(
        null, apiData.bssid, apiData.networkName, apiData.extraData,
        infraMacAddresses, associatedMacAddresses
    )
}

module.exports = {
    WifiologyServiceSet,
    fromRow,
    fromAPI
};
