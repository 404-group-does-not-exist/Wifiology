async function selectAllKeyValuePairs(client, limit, offset) {
    let result = await client.query(
        "SELECT * FROM kvStore ORDER BY keyName LIMIT $1 OFFSET $2",
        [limit, offset]
    );
    return result.rows.reduce((obj,item) =>{ obj[item.keyname] = obj.value; return obj;}, {});
}

async function insertKeyValuePair(client, key, value) {
    let result = await client.query(
        "INSERT INTO kvStore (keyName,value) VALUES ($1,$2) ON CONFLICT (keyName) DO UPDATE value = $2",
        [key, value]
    );
    return null;
}

module.exports = {
    selectAllKeyValuePairs,
    insertKeyValuePair
};