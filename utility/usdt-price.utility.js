const axios = require("axios");

module.exports.initPrice = () => {
    setInterval(async () => {
        try {
            let response = await axios.get('https://public.coindcx.com/market_data/orderbook?pair=I-USDT_INR');
            let data = response.data;
            // console.log(data);
            Object.keys(data.asks).forEach((key, index) => {
                if (index === 1) {
                    global.USDT_PRICE.buy = Number(key);
                }
            })
            Object.keys(data.bids).forEach((key, index) => {
                if (index === 1) {
                    global.USDT_PRICE.sell = Number(key);
                }
            })
        } catch (e) {
        }
    }, 1000)
}
