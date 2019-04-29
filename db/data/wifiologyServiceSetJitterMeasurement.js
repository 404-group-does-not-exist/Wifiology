const { selectServiceSetLatestJitterData } = require('../queries/wifiologyServiceSetJitterMeasurement');
const RELATIVE_THRESHOLD_MIN = 5.0;
const RELATIVE_THRESHOLD_MAX = 50.0;

async function getServiceSetBusyStatusFromJitter(client, serviceSetID){
    let resultRows = await selectServiceSetLatestJitterData(client, serviceSetID);
    if(resultRows.length === 0){
        return {
            isBusy: false,
            isUnknownStatus: true,
            reason: 'No measurements'
        }
    }
    else {
        let isCongested = false;
        let isBadData = false;
        let maxMeasurementTime;
        for(let row of resultRows){
            if(!maxMeasurementTime || row.jitterMeasurementTime > maxMeasurementTime){
                maxMeasurementTime = row.jitterMeasurementTime;
            }
            if(row.relativeAverageJitter > RELATIVE_THRESHOLD_MIN){
                isCongested = true;
            }
            if(row.relativeAverageJitter > RELATIVE_THRESHOLD_MAX){
                isBadData = true;
            }
        }
        if(!isCongested && !isBadData){
            return {
                isBusy: false,
                isUnknownStatus: false,
                maxMeasurementTime
            }
        }
        else if(isCongested && !isBadData){
            return {
                isBusy: true,
                isUnknownStatus: false,
                maxMeasurementTime
            }
        }
        else {
            return {
                isBusy: false,
                isUnknownStatus: true,
                maxMeasurementTime,
                reason: 'Bad looking jitter data'
            }
        }

    }
}


module.exports = {
    getServiceSetBusyStatusFromJitter
};