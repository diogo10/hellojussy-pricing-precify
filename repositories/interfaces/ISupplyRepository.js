export interface ISupplyRepository {
  findByProductId(productId: string): Promise<Supply[]>;
  create(productId: string, supplies: CreateSupplyDTO[]): Promise<boolean>;
  update(supplyId: string, userId: string, data: UpdateSupplyDTO): Promise<boolean>;
  deleteByProductId(productId: string): Promise<boolean>;
  deleteByRemoteId(supplyId: string, userId: string): Promise<boolean>;
}

export interface Supply {
  id: string;
  _id: string;
  name: string;
  value: number;
  qt: number;
  qtValue: number;
  unit: string;
}

export interface CreateSupplyDTO {
  id: string;
  name: string;
  value: number;
  qt: number;
  qtValue: number;
  unit: string;
}

export interface UpdateSupplyDTO {
  name: string;
  qt: number;
  qtValue: number;
  unit: string;
}