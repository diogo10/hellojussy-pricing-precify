const assert = require('assert');
const queries = require('../supplies_queries');

describe('Should validate queries for supplies', () => {
    it('insert', () => {

        const MOCK = 'INSERT INTO products_supplies(supply_name, value, qt, qtvalue, unit, product_id, supply_identity_id) ' + 
        'VALUES(?, ?, ?, ?, ?, ?, ?)';

        assert.strictEqual(MOCK, queries.SUPPLY_INSERT);
    });

    it('delete', () => {

        const MOCK = 'DELETE FROM products_supplies WHERE product_id = ?';

        assert.strictEqual(MOCK, queries.DELETE_BY_ID);
    });

    it('delete WITH USER', () => {

        const MOCK = 'DELETE FROM products_supplies WHERE supply_identity_id = ? ' +
        'AND product_id in (select id from products where userid = ?);';

        assert.strictEqual(MOCK, queries.DELETE_BY_IN_AND_USER);
    });

    it('SUPPLY_SELECT_BY_PRODUCT_ID', () => {

        const MOCK = 'SELECT id, supply_identity_id as _id, supply_name as name, value, qt, qtvalue, unit FROM products_supplies WHERE product_id = ?';

        assert.strictEqual(MOCK, queries.SUPPLY_SELECT_BY_PRODUCT_ID);
    });
});