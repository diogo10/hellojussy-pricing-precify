require('dotenv').config()
const express = require('express')
const app = express();
const PORT = process.env.PORT || 3000
const db = require('./db');

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

app.use(function(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  }
  next();
});

app.use(allowCrossDomain)
app.use(express.json())


app.get('/', (req, res) => {
    res.send("I am working");
});

app.get('/api/products', db.getProducts);
app.get('/api/product/:id', db.getProductGetEdit);
app.post('/api/products/create', db.createProduct);
app.put('/api/products/save/:id', db.updateProduct);
app.delete('/api/product/:id', db.deleteProduct);

app.post('/api/products/recalculate', db.recalculate);

// Recalculate related endpoints
// These endpoints are going to trigger the recalculation

app.post('/api/product/update/recipe', db.updateRecipe);
app.post('/api/product/delete/recipe', db.deleteRecipe);

app.post('/api/product/update/supply', db.updateSupply);
app.post('/api/product/delete/supply', db.deleteSupply);

app.post('/api/product/delete', db.deleteAll);


app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
