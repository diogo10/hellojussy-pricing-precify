const text = 'INSERT INTO products_supplies(supply_name, value, qt, qtvalue, unit, product_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING id'

async function queryAddSupplies(pool, parentId, list) {

  const pArray = list.map(async element => {
    var values = [element.name, element.value, element.qt, element.qtValue, element.unit, parentId];
    const response = await executeQuery(pool, values);
    return response;
  });

  const results = await Promise.all(pArray);

  let resultToReturn = results.every(function (e) {
    return e;
  });

  console.log("queryAddSupplies: " + resultToReturn);
  return resultToReturn;
}

async function executeQuery(pool, values) {
  try {
    const response = await pool.query(text, values);
    const resultId = response.rows[0].id;
    console.log("add supply id: " + resultId);
    return resultId != null;
  } catch (err) {
    console.log(err.stack)
    return false;
  }
}

module.exports = {
  queryAddSupplies
}