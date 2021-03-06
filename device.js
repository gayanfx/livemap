"use strict";
var db = require('./db.js');

var devices = [];

//
// Exported modules
//

function loadDevicesFromDB(callback) {
    db.queryDb('getAllDevices', [], function (err, rows, result) {
        if (err === null) {
            if (rows === null) {
                devices = [];
            } else {
                devices = rows;
            }
            return callback(null);
        } else {
            return callback(err);
        }
    });
}

function getDeviceByIdentity(apiKey, identifier, callback) {
    var i = 0;

    // Check if the device is already loaded in memory
    while ((i < devices.length) && (devices[i].api_key !== apiKey || devices[i].identifier !== identifier)) {
        i++;
    }
    if (i !== devices.length) {
//        console.log('findDeviceByIdentity - from memory: ' + JSON.stringify(devices[i]));
        return callback(devices[i]);
    } else {
//        console.log('findDeviceByIdentity - from DB: ' + apiKey);
        db.queryDb('insertDevice', [apiKey, identifier, identifier], function (err, rows, result) {
            if (err === null && rows !== null) {
//                console.log('findDeviceByIdentity - new: ' + JSON.stringify(rows[0]));
                devices.push(rows[0]);
                return callback(rows[0]);
            } else {
//                console.log('findDeviceByIdentity - insert failed: ' + err);
                return callback(null);
            }
        });
    }
}

function getDevicesByUser(userid, callback) {
    var userdevices = [];

    db.queryDb('findDevicesByUser', [userid], function (err, rows, result) {
        if (err === null) {
            if (rows !== null) {
                userdevices = rows;
            }
            return callback(null, userdevices);
        } else {
            return callback(err, null);
        }
    });
}

function changeDevice(modDevice, callback) {
    var err;
    if (modDevice.device_id === 0) {
        db.queryDb('insertDevice', [modDevice.api_key, modDevice.identifier, modDevice.alias], function (err, rows, result) {
            if (err !== null) {
                return callback(err);
            } else {
                if (result.rowCount === 0) {
                    return callback('Unable to add device');
                } else {
                    return callback(null);
                }
            }
        });
    } else {
        db.queryDb('changeDeviceById', [modDevice.device_id, modDevice.alias, modDevice.fixed_loc_lat, modDevice.fixed_loc_lon], function (err, rows, result) {
            if (err !== null) {
                return callback(err);
            } else {
                if (result.rowCount === 0) {
                    return callback('Unable to change device');
                } else {
                    return callback(null);
                }
            }
        });
    }
}

function splitDeviceIdentity(devIdent, dividerChar) {
    var dividerIdx, identityObj = {};

    // Return object with API key and identifier. A valid identity returns err = null, otherwise err = <error string>
    identityObj.apiKey = null;
    identityObj.identifier = null;
    identityObj.err = null;

    dividerIdx = devIdent.indexOf(dividerChar);
    if (dividerIdx < 7) {
        if (dividerIdx < 0) {
            identityObj.err = 'No divider (' + dividerChar + ') found';
        } else {
            identityObj.err = 'API key too short';
        }
    } else {
        // Check if identifier is 2 - 20 characters long
        if (devIdent.length - dividerIdx - 1 < 2 || devIdent.length - dividerIdx - 1 > 20) {
            identityObj.err = 'Identifier should be between 2 - 20 characters';
        } else {
            identityObj.apiKey = devIdent.slice(0, dividerIdx);
            identityObj.identifier = devIdent.slice(dividerIdx + 1);
        }
    }
//    console.log('splitDeviceIdentity: ' + identityObj.err + ' ' + identityObj.apiKey + ' ' + identityObj.identifier + ' ');
    return identityObj;
}

function addSharedUser(sharedUser, ids, callback) {
    // ToDo: check for valid sharedUser and ids ?
    db.queryDb('addSharedUser', [sharedUser, ids], function (err, rows, result) {
        if (err !== null) {
            return callback(err);
        } else {
            if (result.rowCount === 0) {
                return callback('No shared users were added');
            } else {
                return callback(null);
            }
        }
    });
}

function deleteSharedUser(sharedUser, ids, callback) {
    db.queryDb('deleteSharedUser', [sharedUser, ids], function (err, rows, result) {
        if (err !== null) {
            return callback(err);
        } else {
            if (result.rowCount === 0) {
                return callback('No shared users were deleted');
            } else {
                return callback(null);
            }
        }
    });
}

function deleteDevicesById(ids, callback) {
    db.queryDb('deleteDevices', [ids], function (err, rows, result) {
        if (err !== null) {
            return callback(err);
        } else {
            if (result.rowCount === 0) {
                return callback('No devices were deleted');
            } else {
                return callback(null);
            }
        }
    });
}

module.exports.loadDevicesFromDB = loadDevicesFromDB;
module.exports.getDeviceByIdentity = getDeviceByIdentity;
module.exports.getDevicesByUser = getDevicesByUser;
module.exports.changeDevice = changeDevice;
module.exports.splitDeviceIdentity = splitDeviceIdentity;
module.exports.addSharedUser = addSharedUser;
module.exports.deleteSharedUser = deleteSharedUser;
module.exports.deleteDevicesById = deleteDevicesById;
