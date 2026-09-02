export interface IRecipeRepository {
  findByRemoteId(recipeId: string, userId: string): Promise<Recipe[]>;
  create(productId: string, recipes: CreateRecipeDTO[]): Promise<boolean>;
  deleteByProductId(productId: string): Promise<boolean>;
  deleteByRemoteId(recipeId: string, userId: string): Promise<boolean>;
  deleteById(id: string, userId: string): Promise<boolean>;
}

export interface Recipe {
  id: string;
  _id: string;
  name: string;
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

export interface CreateRecipeDTO {
  id: string;
  name: string;
  total: number;
  totalWithTax: number;
  yieldValue: number;
  yieldValueUnit: number;
  quantity: number;
  products: CreateRecipeProductDTO[];
}

export interface CreateRecipeProductDTO {
  id: string;
  name: string;
  value: number;
  status: string;
  qt: number;
  qtValue: number;
  unit: string;
}