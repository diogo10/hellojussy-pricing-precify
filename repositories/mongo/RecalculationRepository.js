const { Db, Collection } = require('mongodb');
const { BaseRepository } = require('./BaseRepository.js');

const COLLECTION_PRODUCTS = 'products';
const COLLECTION_SUPPLIES = 'supplies';
const COLLECTION_RECIPES = 'recipes';
const COLLECTION_RECIPE_PRODUCTS = 'recipe_products';

/**
 * MongoDB Recalculation Repository implementing IRecalculationRepository interface
 * Extends BaseRepository for common operations
 */
class MongoRecalculationRepository extends BaseRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db);
    this.collectionName = COLLECTION_PRODUCTS;
  }

  /**
   * Execute recalculation for all products of a user using aggregation pipeline
   * @param {number} tax - Tax percentage
   * @param {number} markup - Markup percentage
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async executeRecalculate(tax, markup, userId) {
    const pipeline = [
      { $match: { userid: userId } },
      {
        $set: {
          total_extras: {
            $sum: {
              $map: {
                input: '$supplies',
                as: 's',
                in: {
                  $let: {
                    vars: {
                      baseCost: { $multiply: ['$$s.value', { $divide: ['$$s.qtvalue', '$$s.qt'] }] }
                    },
                    in: {
                      $cond: [
                        { $eq: ['$$s.unit', 'KG'] },
                        { $divide: ['$$baseCost', 1000] },
                        '$$baseCost'
                      ]
                    }
                  }
                }
              }
            }
          },
          total_fichas: {
            $sum: {
              $map: {
                input: '$recipes',
                as: 'r',
                in: {
                  $multiply: [
                    { $divide: ['$$r.total', '$$r.yieldvalue'] },
                    '$$r.quantity'
                  ]
                }
              }
            }
          }
        }
      },
      {
        $set: {
          product_cost: { $add: ['$total_extras', '$total_fichas'] },
          product_cost_with_tax: {
            $add: ['$product_cost', { $multiply: ['$product_cost', { $divide: [tax, 100] }] }]
          },
          product_cost_with_markup: {
            $add: ['$product_cost', { $multiply: ['$product_cost', { $divide: [markup, 100] }] }]
          },
          product_cost_with_markup_tax: {
            $add: [
              '$product_cost_with_markup',
              { $multiply: ['$product_cost_with_markup', { $divide: [tax, 100] }] }
            ]
          },
          updated_at: new Date()
        }
      },
      { $merge: { into: COLLECTION_PRODUCTS, on: '_id', whenMatched: 'merge' } }
    ];

    await this.collection.aggregate(pipeline).toArray();
    return true;
  }

  /**
   * Delete all data for a user (products, supplies, recipes, recipe products)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async deleteAll(userId) {
    const productIds = await this.findAll({ userid: userId }, { projection: { _id: 1 } });
    const productIdStrings = productIds.map(p => p._id.toString());

    await Promise.all([
      this.db.collection(COLLECTION_SUPPLIES).deleteMany({ product_id: { $in: productIdStrings } }),
      this.db.collection(COLLECTION_RECIPE_PRODUCTS).deleteMany({ product_id: { $in: productIdStrings } }),
      this.db.collection(COLLECTION_RECIPES).deleteMany({ product_id: { $in: productIdStrings } }),
      this.deleteMany({ userid: userId })
    ]);

    return true;
  }
}

module.exports = {
  MongoRecalculationRepository
};