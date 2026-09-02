import { RepositoryFactory } from '../repositories/RepositoryFactory.js';
import { ISupplyRepository, IRecalculationRepository } from '../repositories/interfaces/index.js';

export class SupplyService {
  constructor(
    private supplyRepository: ISupplyRepository,
    private recalculationRepository: IRecalculationRepository
  ) {}

  static createFromFactory(): SupplyService {
    const factory = RepositoryFactory.getInstance();
    return new SupplyService(
      factory.getSupplyRepository(),
      factory.getRecalculationRepository()
    );
  }

  async updateSupply(supplyId: string, userId: string, supplyData: any): Promise<boolean> {
    const updated = await this.supplyRepository.update(supplyId, userId, {
      name: supplyData.name,
      qt: supplyData.qt,
      qtValue: supplyData.qtValue,
      unit: supplyData.unit
    });

    if (updated) {
      // These values would come from external services
      const tax = 0; // await revenueTaxService.getTaxTotal(userId);
      const markup = 0; // await revenueTaxService.getMarkup(userId);
      await this.recalculationRepository.executeRecalculate(tax, markup, userId);
    }

    return updated;
  }

  async deleteSupply(supplyId: string, userId: string): Promise<boolean> {
    const deleted = await this.supplyRepository.deleteByRemoteId(supplyId, userId);
    if (deleted) {
      const tax = 0;
      const markup = 0;
      await this.recalculationRepository.executeRecalculate(tax, markup, userId);
    }
    return deleted;
  }
}