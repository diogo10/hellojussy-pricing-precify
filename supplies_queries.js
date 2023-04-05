const SUPPLY_INSERT = 'INSERT INTO products_supplies(supply_name, value, qt, qtvalue, unit, product_id, supply_identity_id) ' + 
'VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id';

const DELETE_BY_ID = 'DELETE FROM products_supplies WHERE product_id = $1 RETURNING id';

const DELETE_BY_IN_AND_USER = 'DELETE FROM products_supplies WHERE supply_identity_id = $1 ' +
'AND product_id in (select id from products where userid = $2);';

module.exports = {
    SUPPLY_INSERT,
    DELETE_BY_ID,
    DELETE_BY_IN_AND_USER
}