const assert = require("assert");
const supplyUpdates = require("../supplies-update");

describe("mapSupplyBody validations ", () => {
  it("mapSupplyBody - with no id", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
    });

    assert.strictEqual(result.name, "A");
    assert.strictEqual(result.qt, undefined);
    assert.strictEqual(result.qtValue, undefined);
    assert.strictEqual(result.unit, undefined);
  });

  it("mapSupplyBody - with id", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
      id: "1",
      qt: 10,
      qtValue: 5,
      unit: "KG"
    });

    assert.strictEqual(result.name, "A");
    assert.strictEqual(result.qt, 10);
    assert.strictEqual(result.qtValue, 5);
    assert.strictEqual(result.unit, "KG");
  });
});