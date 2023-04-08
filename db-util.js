async function executeDeleteQuery(pool, sql, values) {
return executeUpdateQuery(pool, sql, values);
}

async function executeUpdateQuery(pool, sqlUpdateSupplies, values) {
    try {
        console.log("---------------------");
        console.log("\u001b[1;34m executeQuery text: " + sqlUpdateSupplies);
        console.log("");
        const response = await pool.query(sqlUpdateSupplies, values);
        const result = response.affectedRows > 0;
        console.log("\u001b[1;34m executeQuery result:" + result);
        console.log("");
        console.log("---------------------");
        return result;
    } catch (err) {
        console.log(err.stack)
        return false;
    }
}


async function recalculate(pool, values) {
    return executeProcedure(pool, "CALL procedure_recalculate(?,?,?);", values);
}

async function deleteAll(pool, values) {
    return executeProcedure(pool, "CALL procedure_delete_all(?);", values);
}

async function executeProcedure(pool, procedureName, values) {
    try {
        console.log("---------------------");
        console.log("\u001b[1;34m executeProcedure procedureName: " + procedureName);
        const response = await pool.query(procedureName, values);
        const result = response.affectedRows >= 0;
        console.log("\u001b[1;34m executeProcedure result: " + result);
        console.log("---------------------");
        return result;
    } catch (err) {
        console.log(err.stack)
        return false;
    }
}

module.exports = {
    executeUpdateQuery, executeDeleteQuery, recalculate, deleteAll
}