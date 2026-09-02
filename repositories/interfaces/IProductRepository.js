export interface IProductRepository {
  findAllByUserId(userId: string): Promise<Product[]>;
  findById(userId: string, productId: string): Promise<ProductWithDetails | null>;
  create(data: CreateProductDTO): Promise<string>;
  update(productId: string, data: UpdateProductDTO): Promise<boolean>;
  delete(productId: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<boolean>;
}

export interface Product {
  id: string;
  product_name: string;
  userid: string;
  profit_percentage: string;
  price: number;
  product_cost: number;
  product_cost_with_tax: number;
  product_cost_with_markup: number;
  product_cost_with_markup_tax: number;
  total_fichas: number;
  total_extras: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithDetails extends Product {
  supplies: Supply[];
  recipes: RecipeWithProducts[];
}

export interface CreateProductDTO {
  name: string;
  userId: string;
  prof: string;
  price: number;
  cost: number;
  costWithTax: number;
  costWithMarkup: number;
  costWithMarkupTax: number;
  totalFichas: number;
  totalExtras: number;
}

export interface UpdateProductDTO {
  name: string;
  userId: string;
  prof: string;
  price: number;
  cost: number;
  costWithTax: number;
  costWithMarkup: number;
  costWithMarkupTax: number;
  totalFichas: number;
  totalExtras: number;
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

export interface RecipeWithProducts {
  id: string;
  _id: string;
  name: string;
  value: number;
  status: string;
  qt: number;
  qtValue: number;
  unit: string;
  quantity: number;
  total: number;
  totalWithTax: number;
  yieldValue: number;
  yieldValueUnit: number;
  products: RecipeProduct[];
}

export interface RecipeProduct {
  id: string;
  _id: string;
  name: string;
  value: number;
  status: string;
  qt: number;
  qtValue: number;
  unit: string;
}