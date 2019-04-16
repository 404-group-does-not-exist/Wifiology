const { fromRow } = require('../models/wifiologyStation');

async function insertWifiologyStation(client, newWifiologyStation) {
    let result = await client.query(
        `INSERT INTO station(
            macaddress, extraData
        ) VALUES (
           $macAdress, $extraData
        ) ON CONFLICT (macaddress) DO NOTHING RETURNING stationid`,
        newWifiologyStation.toRow()
    );
    if(result.rows.length > 0){
        return result.rows[0].stationid;
    } else {
        return null;
    }
}


module.exports = {
    insertWifiologyStation
};