const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

const getProducts = (request, response) => {
  const id = request.query.id;

  pool.query('SELECT * FROM products WHERE userid = $1', [id])
  .then(res => {
    response.status(200).json(res.rows);
  })
  .catch(e => {
    console.error(e.stack);
    response.status(500).json("NOK");
  });
};


const createProduct = (request, response) => {
  const { name, userId, prof, price  } = request.body;

  pool.query('INSERT INTO products (product_name, userid, prof, price, created_at, updated_at) VALUES ($1, $2, $3, $4, now(),now())', [name, userId,prof, price])
  .then(res => {
    response.status(200).json("OK");
  })
  .catch(e => {
    console.error(e.stack);
    response.status(500).json("NOK");
  });
};



module.exports = {
    getProducts, createProduct
}