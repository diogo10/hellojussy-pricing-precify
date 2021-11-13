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

function extractToken (req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
      return req.query.token;
  }
  return null;
}

app.use(allowCrossDomain)
app.use(express.json())


app.get('/', (req, res) => {
    res.send("I am working");
});

app.get('/api/products', db.getProducts);
app.post('/api/products/create', db.createProduct);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
