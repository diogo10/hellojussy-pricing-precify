const assert = require("assert");
const supplyUpdates = require("../supplies-update");

describe("mapSupplyBody validations ", () => {
  it("mapSupplyBody - with no id", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
    });

    assert.strictEqual(result[4], "");
  });

  it("mapSupplyBody - with id", () => {
    let result = supplyUpdates.mapSupplyBody({
      name: "A",
      id: "1",
    });

    assert.strictEqual(result[4], "1");
  });
});
