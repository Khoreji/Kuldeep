const { dcxPublicApi } = require("../../utility/api.utility")

const initMarketData = async () => {
    //get market data from DCX
    const response = await dcxPublicApi('GET', '/exchange/v1/markets_details').catch(err => console.log('err', err));
    const { data } = response;
    data.forEach((item) => {
        global.DCX_MARKET_INFO[`${item.symbol}`] = {
            'price_precision': item.base_currency_precision,
            'quantity_precision': item.target_currency_precision,
        }
    })
}

module.exports = {
    initMarketData
}