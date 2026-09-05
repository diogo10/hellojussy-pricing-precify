const interfaces = require('./interfaces/index.js');
const postgres = require('./postgres/index.js');
const mongo = require('./mongo/index.js');
const { RepositoryFactory } = require('./RepositoryFactory.js');

module.exports = {
  ...interfaces,
  ...postgres,
  ...mongo,
  RepositoryFactory
};
