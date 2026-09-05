const { Db, Collection } = require('mongodb');
const { BaseRepository } = require('./BaseRepository.js');

const COLLECTION_PRODUCTS = 'products';
const COLLECTION_SUPPLIES = 'supplies';
const COLLECTION_RECIPES = 'recipes';

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
  }

  get collectionName() {
    return COLLECTION_PRODUCTS;
  }

  /**
   * Execute recalculation for all products of a user using aggregation pipeline
   * @param {number} tax - Tax percentage
   * @param {number} markup - Markup percentage
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async executeRecalculate(tax, markup, userId) {
    const safeTax = Number(tax) || 0;
    const safeMarkup = Number(markup) || 0;

    const pipeline = [
      { $match: { userid: userId } },
      {
        $set: {
          total_extras: {
            $round: [
              {
                $sum: {
                  $map: {
                    input: { $ifNull: ['$supplies', []] },
                    as: 's',
                    in: {
                      $cond: [
                        { $eq: [{ $ifNull: ['$$s.qt', 0] }, 0] },
                        0,
                        {
                          $let: {
                            vars: {
                              baseCost: {
                                $multiply: [
                                  { $ifNull: ['$$s.value', 0] },
                                  { $divide: [{ $ifNull: ['$$s.qtvalue', 0] }, '$$s.qt'] },
                                ],
                              },
                            },
                            in: {
                              $cond: [
                                { $eq: ['$$s.unit', 'KG'] },
                                { $divide: ['$$baseCost', 1000] },
                                '$$baseCost',
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
              2,
            ],
          },
          total_fichas: {
            $round: [
              {
                $sum: {
                  $map: {
                    input: { $ifNull: ['$recipes', []] },
                    as: 'r',
                    in: {
                      $cond: [
                        { $eq: [{ $ifNull: ['$$r.yieldvalue', 0] }, 0] },
                        0,
                        {
                          $multiply: [
                            {
                              $divide: [
                                { $ifNull: ['$$r.total', 0] },
                                '$$r.yieldvalue',
                              ],
                            },
                            { $ifNull: ['$$r.quantity', 0] },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              2,
            ],
          },
        },
      },
      {
        $set: {
          product_cost: { $round: [{ $add: ['$total_extras', '$total_fichas'] }, 2] },
        },
      },
      {
        $set: {
          product_cost_with_tax: {
            $round: [
              { $add: ['$product_cost', { $multiply: ['$product_cost', { $divide: [safeTax, 100] }] }] },
              2,
            ],
          },
          product_cost_with_markup: {
            $round: [
              { $add: ['$product_cost', { $multiply: ['$product_cost', { $divide: [safeMarkup, 100] }] }] },
              2,
            ],
          },
          updated_at: new Date(),
        },
      },
      {
        $set: {
          product_cost_with_markup_tax: {
            $round: [
              {
                $add: [
                  '$product_cost_with_markup',
                  { $multiply: ['$product_cost_with_markup', { $divide: [safeTax, 100] }] },
                ],
              },
              2,
            ],
          },
        },
      },
      { $merge: { into: COLLECTION_PRODUCTS, on: '_id', whenMatched: 'merge' } },
    ];

    await this.collection.aggregate(pipeline).toArray();
    return true;
  }

  /**
   * Delete all data for a user (products, supplies, recipes)
   * Recipe products are embedded within recipes, so only recipes collection needs cleanup
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async deleteAll(userId) {
    const productIds = await this.findAll({ userid: userId }, { projection: { _id: 1 } });
    const productIdStrings = productIds.map(p => p._id.toString());

    await Promise.all([
      this.db.collection(COLLECTION_SUPPLIES).deleteMany({ product_id: { $in: productIdStrings } }),
      this.db.collection(COLLECTION_RECIPES).deleteMany({ product_id: { $in: productIdStrings } }),
      this.deleteMany({ userid: userId })
    ]);

    return true;
  }
}

module.exports = {
  MongoRecalculationRepository
};