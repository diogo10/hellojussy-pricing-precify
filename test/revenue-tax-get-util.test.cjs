const assert = require("assert");
const util = require("../revenue-tax-get-util");

describe("Should validate cal markup", () => {
  it("should be 100", () => {
    assert.strictEqual(util.calculateMarkup(10, 10), 100);
  });

  it("should handle Nan on expenses", () => {
    assert.strictEqual(util.calculateMarkup(NaN, 10), 0);
  });

  it("should handle Nan on revenue", () => {
    assert.strictEqual(util.calculateMarkup(10, NaN), 0);
  });

  it("should handle zero on all", () => {
    assert.strictEqual(util.calculateMarkup(0, 0), 0);
  });
});