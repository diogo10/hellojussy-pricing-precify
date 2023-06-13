const utils = require("./db-util");
const queries = require("./supplies_queries");
const sql = queries.SUPPLY_UPDATE;

async function updateSupplies(pool, supply, userId) {
  var values = mapSupplyBody(supply, userId);
  var hasUpdated = await utils.executeUpdateQuery(pool, sql, values);
  return hasUpdated;
}

function mapSupplyBody(supply, userId) {
  var id = supply.id;
  var value = supply.value;

  if (value === undefined) {
    value = 0;
  }

  if (id === undefined) {
    id = supply._id;
  }

  if (id === undefined) {
    id = "";
  }

  return [
    supply.name,
    supply.qt,
    supply.qtValue,
    supply.unit,
    value,
    id,
    userId,
  ];
}

module.exports = {
  updateSupplies, mapSupplyBody
};
