const utils = require('./db-util');

async function executeDeleteAll(pool, userId) {
    var result = await utils.deleteAll(pool, [userId]);
    console.log("executeDeleteAll: result: " + result);
    return result;
}

module.exports = {
    executeDeleteAll
}