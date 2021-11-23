const axios = require('axios');

async function getRevenueTotal(token) {
    const calRevenue = 'https://intense-eyrie-52474.herokuapp.com/api/revenue/total'
    return execute(calRevenue, token);
}

async function getTaxTotal(token) {
    const calTaxTotals = "https://secret-sands-58738.herokuapp.com/api/taxes/total"
    return execute(calTaxTotals, token);
}

async function getTotalExpenses(token) {
    const calExpenses = "https://hellojussy-pricing-expenses.vercel.app/api/expenses/total"
    return execute(calExpenses, token);
}

async function getMarkup(token) {
    var revenue = await getRevenueTotal(token);
    var expenses = await getTotalExpenses(token);
    var result = ((expenses / revenue) * 100);
    return result;
}

async function execute(endpoint, token) {
    try {
        var result = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        return Number(result.data.total);
    } catch (err) {
        console.log(err.stack);
        return Number(0.0);
    }
}

module.exports = { getMarkup, getTaxTotal }