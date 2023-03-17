const { placeOrder } = require("../../../coindcx/api/auth.api");

const initStraightFlow = () => {
    global.CUSTOM_EVENT.on('straight-flow', async (opportunity) => {


        let coin = opportunity.coin.split('USDT')[0];
        // global.ONGOING_TRADES[coin].t3 = performance.now();
        let usdtBalance = global.DCX_BALANCE?.USDT?.free;
        let tradeValue = opportunity.bltp * opportunity.qty;


        let payload = {
            "side": "buy",
            "order_type": "market_order",
            "market": `${coin}USDT`,
            client_order_id: `${String(Date.now()).substring(7)}InrPrice${opportunity.fp}`
        };
        if (global.huobiCoins.includes(coin)) {
            payload.market = `${coin}USDT`,
                payload.order_type = "limit_order",
                payload.price_per_unit = opportunity.bltp
        }
        // Check if the USDT balance is sufficient, If the USDT balance is not sufficient trade partially
        if (usdtBalance >= tradeValue) {
            payload.total_quantity = opportunity.qty;
        } else if (usdtBalance > 20) { // trade partially
            console.log("Trading partially", usdtBalance, opportunity.bltp);
            let qty = (usdtBalance / opportunity.bltp);
            qty = (qty * 97.5) / 100;
            payload.total_quantity = qty;
        }
        else {
            global.CUSTOM_EVENT.emit('log', {
                level: 'error',
                message: "Insufficient balance in USDT"
            })
            return;
        }


        let order = await placeOrder(payload);

        // global.ONGOING_TRADES[coin].t4 = performance.now();

        setTimeout(() => {
            delete global.ONGOING_TRADES[coin];
            // Sell or buy the remaining quantity if final flow is not executed
            // if (Number(global.DCX_BALANCE[coin]?.free) > 0 && Number(global.DCX_BALANCE[coin]?.free) < Number(opportunity.qty)) {
            //     if (Number(global.DCX_BALANCE[coin].free) * Number(opportunity.bltp) < 10) return;
            //     let payload = {
            //         side: "sell",
            //         order_type: "limit_order",
            //         market: `${coin}INR`,
            //         total_quantity: Number(global.DCX_BALANCE[coin].free),
            //         price_per_unit: opportunity.fp
            //     };
            //     placeOrder(payload);
            // }
        }, 4000);


        // Add the order id to the ongoing trades for second leg
        if (!order.id || !global.ONGOING_TRADES[coin]) return;
        global.ONGOING_TRADES[coin].orderId = order?.id;
        global.ORDER_IDS[order.id] = {
            executedQuantity: 0,
            total_quantity: order.total_quantity,
        }
        setTimeout(() => {
            delete global.ORDER_IDS[order.id];
        }, 10000);
        global.ONGOING_TRADES[coin].status = 'first-leg-placed';
    })
};

module.exports = {
    initStraightFlow
};