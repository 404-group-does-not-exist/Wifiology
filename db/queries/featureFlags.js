async function upsertFeatureFlag(client, key, value) {
    let result = await client.query(
        `INSERT INTO featureFlag(featureFlagKey, featureFlagValue)
         VALUES($key, $value) ON CONFLICT (featureFlagKey) DO UPDATE SET featureFlagValue = $value`,
        {key, value}
    );
    return result.rowCount;
}

async function deleteFeatureFlag(client, key) {
    let result = await client.query(
        `DELETE FROM featureFlag WHERE featureFlagKey = $key`,
        {key}
    );
    return result.rowCount;
}

async function selectFeatureFlag(client, key, defaultValue=null){
    let result = await client.query(
        "SELECT featureFlagValue FROM featureFlag WHERE featureFlagKey = $key",
        {key}
    );
    if(result.rows.length >= 1){
        return result.rows[0].featureflagvalue;
    } else {
        return defaultValue
    }
}


async function selectAllFeatureFlags(client){
    let result = await client.query(
        "SELECT featureFlagKey, featureFlagValue FROM featureFlag",
        []
    );
    result.reduce((acc, row) => {
        acc[row.featureflagkey] = row.featureflagvalue;
        return acc;
    }, {});
}

async function selectFeatureFlagsByPrefix(client, prefix){
    let result = await client.query(
        "SELECT featureFlagKey, featureFlagValue FROM featureFlag WHERE featureFlagKey LIKE $prefix || '%'",
        {prefix}
    );
    result.reduce((acc, row) => {
        acc[row.featureflagkey] = row.featureflagvalue;
        return acc;
    }, {});
}


module.exports = {
  upsertFeatureFlag,
  deleteFeatureFlag,
  selectFeatureFlag,
  selectAllFeatureFlags,
  selectFeatureFlagsByPrefix
};