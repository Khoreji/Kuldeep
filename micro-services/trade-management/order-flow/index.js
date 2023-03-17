const initFinalFlow = require("./final.flow");
const { initReverseFlow } = require("./reverse.flow");
const { initStraightFlow } = require("./straight.flow");

const initOrderFlow = () => {
    // Initiate the straight and reverse flow
    initStraightFlow();
    initReverseFlow();
    initFinalFlow();

    // Initiate the order flow
    global.CUSTOM_EVENT.on('opportunity-found', (opportunity) => {

        // opportunity.t2 = performance.now();

        let usdtBalance = global.DCX_BALANCE?.USDT?.free;
        let inrBalance = global.DCX_BALANCE?.INR?.free;

        if (opportunity.type == 'straight') {
            if (usdtBalance < 20) {
                global.CUSTOM_EVENT.emit('log', {
                    level: 'error',
                    message: `USDT Balance: ${usdtBalance}`
                })
                delete global.ONGOING_TRADES[opportunity.coin];
                global.FRONT_END_ERROR[`LOW_USDT`] = {
                    head: `Global | Balance | ${global.TIME}`,
                    body: `LOW USDT BALANCE: ${usdtBalance}`
                }
                return;
            }
            else {
                delete global.FRONT_END_ERROR[`LOW_USDT`];
            }
        }

        if (opportunity.type == 'reverse') {
            if (inrBalance < 1000) {
                global.CUSTOM_EVENT.emit('log', {
                    level: 'error',
                    message: `INR Balance: ${inrBalance}`
                })
                delete global.ONGOING_TRADES[opportunity.coin];
                global.FRONT_END_ERROR[`LOW_INR`] = {
                    head: `Global | Balance | ${global.TIME}`,
                    body: `LOW INR BALANCE: ${inrBalance}`
                }
                return;
            }
            else {
                delete global.FRONT_END_ERROR[`LOW_INR`];
            }

        }

        let coin = opportunity.coin.split('USDT')[0];


        if (global.MALFUNCTIONING_COINS.includes(coin)) {
            global.CUSTOM_EVENT.emit('log', {
                level: 'error',
                message: `${coin} is malfunctioning`
            })
            delete global.ONGOING_TRADES[coin];
            return;
        }
        // Check if the coin is already in the order flow
        if (global.ONGOING_TRADES[coin]) {
            global.CUSTOM_EVENT.emit('log', {
                level: 'error',
                message: global.ONGOING_TRADES[coin]
            })
            return
        };
        opportunity.status = 'initiated' // status of the trade

        // Add the coin to the ongoing trades
        global.ONGOING_TRADES[coin] = {
            ...opportunity,
        }

        // Check if the last trade was the same as the current trade
        if (global.LAST_TRADE[coin]) {
            if (Number(opportunity.qty) == Number(global.LAST_TRADE[coin])) {
                global.CUSTOM_EVENT.emit('log', {
                    level: 'error',
                    message: `Last trade was the same as the current trade for ${coin}`
                })
                global.FRONT_END_ERROR[`${coin}_LAST_TRADE`] = {
                    head: `Global | Last Trade | ${global.TIME}`,
                    body: `Last trade was the same as the current trade for ${coin}`
                }

                setTimeout(() => {
                    delete global.FRONT_END_ERROR[`${coin}_LAST_TRADE`];
                }, 10000)

                delete global.ONGOING_TRADES[coin];
                return
            }
            else {
                delete global.FRONT_END_ERROR[`${coin}_LAST_TRADE`];
            }
        }
        // check if the last quantity deviation is less than 4 or more than 4 percent
        let remainingQty = global?.LAST_QTY_TRADE[coin]?.total_quantity - global?.LAST_QTY_TRADE[coin]?.executedQuantity || 0;
        if (remainingQty > 0) {
            if (remainingQty * 0.99 < opportunity.qty && opportunity.qty < remainingQty * 1.01) {
                global.CUSTOM_EVENT.emit('log', {
                    level: 'error',
                    message: `Last trade quantity deviation is less than 4 or more than 4 percent for ${coin}`
                })
                global.FRONT_END_ERROR[`${coin}_LAST_QTY`] = {
                    head: `Global | Last Qty | ${global.TIME}`,
                    body: `Last trade quantity deviation is less than ${global.LAST_QTY_DEVIATION} or more than ${global.LAST_QTY_DEVIATION} percent for ${coin}`
                }
                delete global.ONGOING_TRADES[coin];
                return
            }
            else {
                delete global.FRONT_END_ERROR[`${coin}_LAST_QTY`];
            }
            setTimeout(() => {
                delete global.FRONT_END_ERROR[`${coin}_LAST_TRADE`];
            }, 10000)
        }
        let floorPrice = Number(opportunity.fp);
        if (opportunity.type == 'reverse') {
            //check if this price is already in the order book
            let orderBook = global.DCX_DEPTH[coin];
            if (orderBook) {
                let bids = orderBook.bids;
                bids = bids.filter(bid => Number(bid[0]) == floorPrice);
                if (bids.length > 0) {
                    global.CUSTOM_EVENT.emit('log', {
                        level: 'error',
                        message: `Order already present in the order book for ${coin}`
                    })
                    global.FRONT_END_ERROR[`${coin}_IN_ORDER_BOOK`] = {
                        head: `Global | Order Book | ${global.TIME}`,
                        body: `Order already present in the order book for ${coin}`
                    }
                    delete global.ONGOING_TRADES[coin];
                    return;
                }
                else {
                    delete global.FRONT_END_ERROR[`${coin}_IN_ORDER_BOOK`];
                }
            }
        }
        else {
            //check if this price is already in the order book
            let orderBook = global.BINANCE_DEPTH[coin];
            if (orderBook) {
                let asks = orderBook.asks;
                asks = asks.filter(ask => Number(ask[0]) == floorPrice);
                if (asks.length > 0) {
                    global.CUSTOM_EVENT.emit('log', {
                        level: 'error',
                        message: `Order already present in the order book for ${coin}`
                    })
                    global.FRONT_END_ERROR[`${coin}_IN_ORDER_BOOK`] = {
                        head: `Global | Order Book | ${global.TIME}`,
                        body: `Order already present in the order book for ${coin}`
                    }
                    delete global.ONGOING_TRADES[coin];
                    return;
                }
                else {
                    delete global.FRONT_END_ERROR[`${coin}_IN_ORDER_BOOK`];
                }
            }
        }

        global.LAST_TRADE[coin] = opportunity.qty

        setTimeout(() => {
            if (global.ONGOING_TRADES[coin]) {
                delete global.LAST_TRADE[coin];
            }
        }, 1000 * 60)

        // Emit the event to the respective flow
        global.CUSTOM_EVENT.emit(`${opportunity.type}-flow`, opportunity);

        //remove the coin from the depth from global depth
        delete global.BINANCE_DEPTH[coin];
        delete global.DCX_DEPTH[coin];

    })
};

module.exports = {
    initOrderFlow,
}