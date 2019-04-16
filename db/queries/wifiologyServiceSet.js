const { fromRow } = require('../models/wifiologyServiceSet');

async function insertWifiologyServiceSet(client, newWifiologyServiceSet) {
    let result = await client.query(
        `INSERT INTO serviceset(
           bssid, networkname, extradata
        ) VALUES (
          $bssid, $networkName, $extraData
        ) RETURNING servicesetid`,
        newWifiologyServiceSet.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].servicesetid;
    } else {
        return null;
    }
}


async function selectWifiologyServiceSetByBssid(client, bssid) {
    let result = await client.query(
        `SELECT * FROM serviceSet WHERE bssid = $1`,
        [bssid]
    );
    if(result.rows.length > 0) {
        return fromRow(result.rows[0]);
    } else {
        return null;
    }
}

module.exports = {
    insertWifiologyServiceSet,
    selectWifiologyServiceSetByBssid
};