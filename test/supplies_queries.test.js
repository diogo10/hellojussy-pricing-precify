const assert = require('assert');
const queries = require('../supplies_queries');

describe('Should validate queries for supplies', () => {
    it('insert', () => {

        const MOCK = 'INSERT INTO products_supplies(supply_name, value, qt, qtvalue, unit, product_id, supply_identity_id) ' + 
'VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id';

        assert.strictEqual(MOCK, queries.SUPPLY_INSERT);
    });

    it('delete', () => {

        const MOCK = 'DELETE FROM products_supplies WHERE product_id = $1 RETURNING id';

        assert.strictEqual(MOCK, queries.DELETE_BY_ID);
    });

    it('delete WITH USER', () => {

        const MOCK = 'DELETE FROM products_supplies WHERE supply_identity_id = $1 ' +
        'AND product_id in (select id from products where userid = $2);';

        assert.strictEqual(MOCK, queries.DELETE_BY_IN_AND_USER);
    });
});