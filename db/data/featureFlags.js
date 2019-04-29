const featureFlagsQueries = require('../queries/featureFlags');
const { transactionWrapper } = require('../core');


async function setFeatureFlag(client, key, value) {
    return await featureFlagsQueries.upsertFeatureFlag(client, key, value);
}

async function deleteFeatureFlag(client, key) {
    return await featureFlagsQueries.deleteFeatureFlag(client, key);
}

async function getFeatureFlag(client, key, defaultValue=null){
    return await featureFlagsQueries.selectFeatureFlag(client, key, defaultValue);
}


async function getAllFeatureFlags(client){
    return await featureFlagsQueries.selectAllFeatureFlags(client);
}

async function getFeatureFlagsByPrefix(client, prefix){
    return await featureFlagsQueries.selectFeatureFlagsByPrefix(client, prefix);
}

class FeatureFlags{
    constructor(pool){
        this.pool = pool;
    }

    async getFlag(flagKey, client=null, defaultValue=null){
        if(client){
            return await getFeatureFlag(client, flagKey, defaultValue);
        }
        else{
            return await transactionWrapper(this.pool, async function(client){
                return await getFeatureFlag(client, flagKey, defaultValue);
            });
        }
    }

    async setFlag(flagKey, flagValue, client=null){
        if(client){
            return await setFeatureFlag(client, flagKey, flagValue);
        }
        else{
            return await transactionWrapper(this.pool, async function(client){
                return await setFeatureFlag(client, flagKey, flagValue);
            });
        }
    }
}

module.exports = {
    setFeatureFlag, deleteFeatureFlag, getFeatureFlag, getAllFeatureFlags, getFeatureFlagsByPrefix,
    FeatureFlags
};