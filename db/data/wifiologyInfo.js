const { selectDatabaseInfo } = require("../queries/wifiologyInfo");

async function getDatabaseInfo(client){
    return await selectDatabaseInfo(client);
}

module.exports = {
    getDatabaseInfo
};