const text = "SELECT * FROM products WHERE userid = ? ORDER BY id DESC";

async function queryGetProduct(pool, userId) {
  try {
    const list = await pool.query(text, [userId]);
    return list;
  } catch (err) {
    console.log(err.stack);
    return [];
  }
}

module.exports = {
  queryGetProduct,
};
