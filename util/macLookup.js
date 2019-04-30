const oui = require('oui');


function lookupMac(macAddress){
    let result = oui(
        macAddress,
        {
            strict: false
        }
    );
    if(!result){
        return 'Unknown Manufacturer';
    } else {
        return result.split('\n')[0];
    }
}

module.exports = {
    lookupMac
};