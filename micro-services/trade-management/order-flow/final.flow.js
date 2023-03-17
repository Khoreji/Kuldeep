const { placeOrder } = require("../../../coindcx/api/auth.api");

const initFinalFlow = () => {
    global.CUSTOM_EVENT.on('order-update', async (update) => {

        const payload = {
            "side": "",
            "order_type": "",
            "market": "",
            "price_per_unit": 0,
            "total_quantity": 0,
        }

        let coin = update.target_currency_short_name;
        let baseCoin = update.base_currency_short_name;
        let side = update.side;

        let orderId = update.id;

        let executedQuantity = global.ORDER_IDS[orderId].executedQuantity || 0;

        let filledQuantity = Number(update.total_quantity) - Number(update.remaining_quantity);

        //if remaining quantity is equal to total quantity then execute nothing

        if (Number(update.remaining_quantity) === Number(update.total_quantity)) return;

        let executableQuantity = filledQuantity - executedQuantity;
        //minimum tradable quantity for INR market is for 100 INR and for USDT market is 10 USDT
        // if base coin is INR and side is buy then it is a reverse flow trade
        if (baseCoin === 'INR' && side === 'buy') {
            let price = update.client_order_id.split("BLTP")[1];
            let bltp = Number(price);
            console.log("BLTP---", bltp);
            let orderUSDTValue = Number(bltp) * Number(executableQuantity);

            // if the order value is less than 10 USDT then execute nothing
            if (orderUSDTValue < 10) {
                if (filledQuantity > (Number(update.total_quantity) * 0.99)) {
                    delete global.ONGOING_TRADES[coin];
                    return;
                }
                return;
            };

            payload.side = 'sell';
            payload.order_type = 'market_order';
            payload.market = `${coin}USDT`;
            payload.total_quantity = executableQuantity;
            if (global.huobiCoins.includes(coin)) {
                payload.market = `${coin}USDT`,
                    payload.order_type = "limit_order",
                    payload.price_per_unit = bltp
            }
            global.global.ORDER_IDS[orderId].executedQuantity = executedQuantity + executableQuantity;

            let order = await placeOrder(payload)
            let firstLegId = orderId;
            let id = order?.id;

            global.CUSTOM_EVENT.emit("post-trade-calculate", [firstLegId, id]);

        }
        // if base coin is USDT and side is buy then it is a straight flow trade
        else if (baseCoin === 'USDT' && side === 'buy') {
            let price = update.client_order_id.split("Price")[1];
            let inrPrice = Number(price);

            let orderINRValue = Number(inrPrice) * Number(executableQuantity);

            // if the order value is less than 100 INR then execute nothing
            if (orderINRValue < 100) {
                if (filledQuantity > (Number(update.total_quantity) * 0.99)) {
                    delete global.ONGOING_TRADES[coin];
                    return;
                }
                return;
            };

            payload.side = 'sell';
            payload.order_type = 'limit_order';
            payload.market = `${coin}INR`;
            payload.price_per_unit = inrPrice;
            payload.total_quantity = executableQuantity;

            global.ORDER_IDS[orderId].executedQuantity = global.ORDER_IDS[orderId]?.executedQuantity + executableQuantity || executableQuantity;

            let order = await placeOrder(payload)

            let firstLegId = orderId;
            let id = order?.id;

            global.CUSTOM_EVENT.emit("post-trade-calculate", [firstLegId, id]);

        }

        global.LAST_QTY_TRADE[coin] = global.ORDER_IDS[orderId];
        if (update.status === 'filled') {
            delete global.ONGOING_TRADES[coin];
        }
    })
}

module.exports = initFinalFlow