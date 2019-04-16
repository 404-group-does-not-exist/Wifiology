const { fromRow } = require('../models/wifiologyServiceSet');

async function insertWifiologyServiceSet(client, newWifiologyServiceSet) {
    let result = await client.query(
        `INSERT INTO serviceset(
           bssid, networkname, extradata
        ) VALUES (
          $bssid, $networkName, $extraData
        ) ON CONFLICT (bssid) DO NOTHING RETURNING servicesetid`,
        newWifiologyStation.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].servicesetid;
    } else {
        return null;
    }
}


module.exports = {
    insertWifiologyServiceSet
};