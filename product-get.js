const queries = require("./products_queries");

async function queryGetProduct(pool, userId) {
  try {
    const list = await pool.query(queries.PRODUCT_GET_BY_ID, [userId]);
    return list;
  } catch (err) {
    console.log(err.stack);
    return [];
  }
}

module.exports = {
  queryGetProduct,
};
