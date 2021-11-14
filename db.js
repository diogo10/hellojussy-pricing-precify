const { Pool } = require('pg');
const suppliesAdd = require('./supplies-add');
const productAdd = require('./product-add');
const productGet = require('./product-get');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

const getProducts = async (request, response) => {
  const id = request.query.id;
  const list = await productGet.queryGetProduct(pool, id);
  response.status(200).json(list);
};


const createProduct = async (request, response) => {
  const { supplies } = request.body;

  const resultProductId = await productAdd.queryAddProduct(pool, request.body);
  const result = await suppliesAdd.queryAddSupplies(pool, resultProductId, supplies);

  response.status(200).json({ status: (result ? 'OK' : 'NOK') });
};



module.exports = {
    getProducts, createProduct
}