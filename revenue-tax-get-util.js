function calculateMarkup(expenses, revenue) {
    var result = Number((expenses / revenue) * 100);
    return result;
}

module.exports = { calculateMarkup }