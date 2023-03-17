const { dcxAuthApi } = require("../../utility/api.utility")
let coinGlobal = "";
module.exports.placeOrder = async (payload) => {
    try {
        let coin = "";
        if (payload.market.includes('USDT')) {
            coin = payload.market.split('USDT')[0];
        } else if (payload.market.includes('INR')) {
            coin = payload.market.split('INR')[0];
        }

        let pricePrecision = global.DCX_MARKET_INFO[payload.market]?.price_precision || 0;
        let quantityPrecision = global.DCX_MARKET_INFO[payload.market]?.quantity_precision || 0;

        let body = payload;
        body.total_quantity = Math.floor(Number(body.total_quantity) * Math.pow(10, quantityPrecision)) / Math.pow(10, quantityPrecision);
        body.price_per_unit = Math.floor(Number(body.price_per_unit) * Math.pow(10, pricePrecision)) / Math.pow(10, pricePrecision);

        if (payload.market.includes('INR')) {
            // payload.client_order_id = `${Date.now()}InrPrice${payload.price_per_unit}`;
        }
        const response = await dcxAuthApi('POST', '/exchange/v1/orders/create', body);
        let { data } = response;
        data = data.orders[0];
        return data;

    } catch (error) {
        console.log(error);
        global.CUSTOM_EVENT.emit('log', {
            level: 'error',
            message: `${error?.response?.data?.message || 'Error'}`
        })
        global.FRONT_END_ERROR[`${coinGlobal}Order`] = {
            head: `Global | API ERROR | ${global.TIME}`,
            body: `DCX Order: ${error?.response?.data?.message || 'Error'}`,
        }
        setTimeout(() => {
            delete global.FRONT_END_ERROR[`${coinGlobal}Order`];
        }, 10000);
        return {};
    }
}

module.exports.multipleOrderStatus = async (ids) => {
    const subUrl = '/exchange/v1/orders/status_multiple';
    try {
        const timeStamp = Math.floor(Date.now());
        const body = {
            "timestamp": timeStamp,
            "ids": ids
        }
        const response = await dcxAuthApi('POST', subUrl, body);
        const { data } = response;
        // console.log(data);
        return data;
    }
    catch (error) {
        console.log("Order status API", error);
        global.CUSTOM_EVENT.emit('log', {
            level: 'error',
            message: `${error?.response?.data?.message || 'Error'}`
        })
        return {};
    }
}

module.exports.cancelOrder = async (id) => {
    const subUrl = '/exchange/v1/orders/cancel';
    try {
        const timeStamp = Math.floor(Date.now());
        const body = {
            "timestamp": timeStamp,
            "id": id
        }
        const response = await dcxAuthApi('POST', subUrl, body);
        const { data } = response;
        // console.log(data);
        return data;
    }
    catch (error) {
        global.CUSTOM_EVENT.emit('log', {
            level: 'error',
            message: `${error?.response?.data?.message || 'Error'}`
        })
        if (error?.response?.data?.message != "Invalid Request") {
            global.FRONT_END_ERROR[`${id}Cancel`] = {
                head: `Global | API ERROR | ${global.TIME}`,
                body: `DCX Cancel: ${error?.response?.data?.message || 'Error'}`,
            }
            setTimeout(() => {
                delete global.FRONT_END_ERROR[`${id}Cancel`];
            }, 10000);
        }
        return {};
    }
}