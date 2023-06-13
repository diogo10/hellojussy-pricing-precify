const assert = require("assert");
const supplyUpdates = require("../supplies-update");

describe("mapSupplyBody validations ", () => {
  it("mapSupplyBody - with no id", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
    });

    assert.strictEqual(result[5], "");
  });

  it("mapSupplyBody - with id", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
      id: "1",
    });

    assert.strictEqual(result[5], "1");
  });

  it("mapSupplyBody - with no value", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
    });

    assert.strictEqual(result[4], 0);
  });

  it("mapSupplyBody - with value", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
      value: 10,
    });

    assert.strictEqual(result[4], 10);
  });
});
