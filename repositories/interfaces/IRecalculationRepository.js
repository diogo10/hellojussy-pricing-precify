export interface IRecalculationRepository {
  executeRecalculate(tax: number, markup: number, userId: string): Promise<boolean>;
  deleteAll(userId: string): Promise<boolean>;
}