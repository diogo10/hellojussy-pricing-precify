import { Db, Collection, ObjectId } from 'mongodb';
import { ISupplyRepository, Supply, CreateSupplyDTO, UpdateSupplyDTO } from '../interfaces/index.js';

const COLLECTION_SUPPLIES = 'supplies';
const COLLECTION_PRODUCTS = 'products';

export class MongoSupplyRepository implements ISupplyRepository {
  constructor(private db: Db) {}

  private get supplies(): Collection {
    return this.db.collection(COLLECTION_SUPPLIES);
  }

  private get products(): Collection {
    return this.db.collection(COLLECTION_PRODUCTS);
  }

  async findByProductId(productId: string): Promise<Supply[]> {
    return this.supplies.find({ product_id: productId }).toArray() as Promise<Supply[]>;
  }

  async create(productId: string, supplies: CreateSupplyDTO[]): Promise<boolean> {
    const docs = supplies.map(supply => ({
      supply_name: supply.name,
      value: supply.value,
      qt: supply.qt,
      qtvalue: supply.qtValue,
      unit: supply.unit,
      product_id: productId,
      supply_identity_id: supply.id
    }));
    const result = await this.supplies.insertMany(docs);
    return result.insertedCount === supplies.length;
  }

  async update(supplyId: string, userId: string, data: UpdateSupplyDTO): Promise<boolean> {
    const productIds = await this.products.find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const result = await this.supplies.updateOne(
      { 
        supply_identity_id: supplyId,
        product_id: { $in: productIdStrings }
      },
      { 
        $set: {
          supply_name: data.name,
          qt: data.qt,
          qtvalue: data.qtValue,
          unit: data.unit
        }
      }
    );
    return result.modifiedCount > 0;
  }

  async deleteByProductId(productId: string): Promise<boolean> {
    const result = await this.supplies.deleteMany({ product_id: productId });
    return result.deletedCount >= 0;
  }

  async deleteByRemoteId(supplyId: string, userId: string): Promise<boolean> {
    const productIds = await this.products.find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const result = await this.supplies.deleteOne({
      supply_identity_id: supplyId,
      product_id: { $in: productIdStrings }
    });
    return result.deletedCount > 0;
  }
}