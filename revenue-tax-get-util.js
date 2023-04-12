function calculateMarkup(expenses, revenue) {
  try {
    var newExpense = 0.0;
    if (!isNaN(expenses)) {
      newExpense = Number(expenses);
    }

    if (isNaN(revenue)) {
      return 0;
    }

    var result = Number((newExpense / revenue) * 100);
    if (isNaN(result)) {
      return 0;
    } else {
      return result;
    }
  } catch (error) {
    return 0;
  }
}

module.exports = { calculateMarkup };
