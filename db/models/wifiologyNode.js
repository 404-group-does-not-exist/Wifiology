class WifiologyNode {
    constructor(nodeID, nodeName, nodeLastSeenTime, nodeLocation, nodeDescription, ownerID, isPublic, nodeData) {
        this.nodeID = nodeID;
        this.nodeName = nodeName;
        this.nodeLastSeenTime = nodeLastSeenTime;
        this.nodeLocation = nodeLocation;
        this.nodeDescription = nodeDescription;
        this.ownerID = ownerID;
        this.isPublic = isPublic;
        this.nodeData = nodeData;
    }

    toRow() {
        return {
            nodeID: this.nodeID,
            nodeName: this.nodeName,
            nodeLastSeenTime: this.nodeLastSeenTime,
            nodeLocation: this.nodeLocation,
            nodeDescription: this.nodeDescription,
            ownerID: this.ownerID,
            isPublic: this.isPublic,
            nodeData: this.nodeData
        }
    }

    toApiResponse() {
        return {
            nodeID: this.nodeID,
            nodeName: this.nodeName,
            nodeLastSeenTime: this.nodeLastSeenTime,
            nodeLocation: this.nodeLocation,
            nodeDescription: this.nodeDescription,
            ownerID: this.ownerID,
            isPublic: this.isPublic,
            nodeData: this.nodeData
        }
    }
}

function fromRow(row) {
    return new WifiologyNode(
        row.nodeid, row.nodename, row.nodelastseentime,
        row.nodelocation, row.nodedescription,
        row.ownerid, row.ispublic, row.nodedata
    );
}

function createNewWifiologyNodeRecord(nodeName, nodeLocation, nodeDescription, ownerID, isPublic, nodeData={}){
    return new WifiologyNode(
        null, nodeName, null,
        nodeLocation, nodeDescription,
        ownerID, isPublic, nodeData
    );
}




module.exports = {
    WifiologyNode,
    fromRow,
    createNewWifiologyNodeRecord
};