const SUPPLY_INSERT = 'INSERT INTO products_supplies(supply_name, value, qt, qtvalue, unit, product_id, supply_identity_id) ' + 
'VALUES(?, ?, ?, ?, ?, ?, ?)';

const DELETE_BY_ID = 'DELETE FROM products_supplies WHERE product_id = ?';

const DELETE_BY_IN_AND_USER = 'DELETE FROM products_supplies WHERE supply_identity_id = ? ' +
'AND product_id in (select id from products where userid = ?);';

const SUPPLY_SELECT_BY_PRODUCT_ID = 'SELECT id, supply_identity_id as _id, supply_name as name, value, qt, qtvalue, unit FROM products_supplies WHERE product_id = ?';

const SUPPLY_UPDATE = 'UPDATE products_supplies SET ' +
    'supply_name=?, qt=?, qtvalue=?, unit=? ' +
    'where supply_identity_id=? ' +
    'AND product_id in (select id from products where userid = ?)';

module.exports = {
    SUPPLY_INSERT,
    DELETE_BY_ID,
    DELETE_BY_IN_AND_USER,
    SUPPLY_SELECT_BY_PRODUCT_ID,
    SUPPLY_UPDATE
}