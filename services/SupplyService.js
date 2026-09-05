const { RepositoryFactory } = require('../repositories/RepositoryFactory.js');

class SupplyService {
  /**
   * @param {Object} supplyRepository - ISupplyRepository implementation
   * @param {Object} recalculationRepository - IRecalculationRepository implementation
   */
  constructor(supplyRepository, recalculationRepository) {
    this.supplyRepository = supplyRepository;
    this.recalculationRepository = recalculationRepository;
  }

  static createFromFactory() {
    const factory = RepositoryFactory.getInstance();
    return new SupplyService(
      factory.getSupplyRepository(),
      factory.getRecalculationRepository()
    );
  }

  async updateSupply(supplyId, userId, supplyData) {
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

  async deleteSupply(supplyId, userId) {
    const deleted = await this.supplyRepository.deleteByRemoteId(supplyId, userId);
    if (deleted) {
      const tax = 0;
      const markup = 0;
      await this.recalculationRepository.executeRecalculate(tax, markup, userId);
    }
    return deleted;
  }
}

module.exports = {
  SupplyService
};
