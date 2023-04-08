const assert = require("assert");
const util = require("../revenue-tax-get-util");

describe("Should validate cal markup", () => {
  it("should be 100", () => {
    assert.strictEqual(util.calculateMarkup(10,10), 10);
  });

  
});
