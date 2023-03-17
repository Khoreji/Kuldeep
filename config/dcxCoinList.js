const axios = require('axios');
const baseUrl = "https://api.coindcx.com"
let coins = [];

const getCoinList = async () => {
    let inrArray = [];
    let usdtArray = [];
    let finalArray = [];
    const response = await axios.get(`${baseUrl}/exchange/v1/markets_details`).catch(err => console.log('err', err));
    response?.data.forEach((item) => {
        item.base_currency_short_name == 'INR' && inrArray.push(item.target_currency_short_name);
        item.base_currency_short_name == 'USDT' && usdtArray.push(item.target_currency_short_name);
    });
    usdtArray.forEach((item) => {
        if (inrArray.includes(item)) {
            finalArray.push(item);
        }
    }
    );
    return finalArray;
}
module.exports.coins = async () => {
    if (coins.length == 0) {
        coins = await getCoinList();
        return coins;
    }
    return coins;
}