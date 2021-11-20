async function executeDeleteQuery(pool, sql, values) {
return executeUpdateQuery(pool, sql, values);
}

async function executeUpdateQuery(pool, sqlUpdateSupplies, values) {
    try {
        console.log("---------------------");
        console.log("\u001b[1;34m executeQuery text: " + sqlUpdateSupplies);
        console.log("");
        const response = await pool.query(sqlUpdateSupplies, values);
        const result = response.rowCount > 0;
        console.log("\u001b[1;34m executeQuery result:" + result);
        console.log("");
        console.log("---------------------");
        return result;
    } catch (err) {
        console.log(err.stack)
        return false;
    }
}

module.exports = {
    executeUpdateQuery, executeDeleteQuery
}