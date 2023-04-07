const queries = require("./supplies_queries");

async function queryAddSupplies(pool, parentId, list) {
  const pArray = list.map(async (element) => {
    var values = [
      element.name,
      element.value,
      element.qt,
      element.qtValue,
      element.unit,
      parentId,
      element.id,
    ];

    const response = await executeQuery(pool, values);
    return response;
  });

  const results = await Promise.all(pArray);

  let resultToReturn = results.every(function (e) {
    return e;
  });

  return resultToReturn;
}

async function executeQuery(pool, values) {
  try {
    const response = await pool.query(queries.SUPPLY_INSERT, values);
    const resultId = response.insertId;
    console.log("add supply id: " + resultId);
    return resultId != null;
  } catch (err) {
    console.log(err.stack);
    return false;
  }
}

module.exports = {
  queryAddSupplies,
};
