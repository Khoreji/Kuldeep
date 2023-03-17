const { placeOrder, cancelOrder } = require("../../../coindcx/api/auth.api");

const initReverseFlow = () => {
    global.CUSTOM_EVENT.on("reverse-flow", async (opportunity) => {
        let coin = opportunity.coin.split("USDT")[0];
        // global.ONGOING_TRADES[coin].t3 = performance.now();
        let inrBalance = global.DCX_BALANCE?.INR?.free;
        let tradeValue = opportunity.fp * opportunity.qty;
        if (!global.ONGOING_TRADES[coin]) return;

        let payload = {
            side: "buy",
            order_type: "limit_order",
            market: `${coin}INR`,
            price_per_unit: opportunity.fp,
            client_order_id: `${String(Date.now()).substring(7)}BLTP${Number(opportunity.bltp).toFixed(6)}`
        };
        // Check if the INR balance is sufficient, If the INR balance is not sufficient trade partially
        if (inrBalance >= tradeValue) {
            payload.total_quantity = opportunity.qty;
        } else if (inrBalance > 1000) {
            // trade partially
            let qty = inrBalance / opportunity.fp;
            qty = (qty * 97.5) / 100;
            payload.total_quantity = qty;
        } else {
            global.CUSTOM_EVENT.emit("log", {
                level: "error",
                message: "Insufficient balance in INR",
            });
            return;
        }

        let order = await placeOrder(payload);

        // global.ONGOING_TRADES[coin].t4 = performance.now();

        // Add the order id to the ongoing trades for second leg
        setTimeout(() => {
            delete global.ONGOING_TRADES[coin];
            cancelOrder(order.id);
            // Sell or buy the remaining quantity if final flow is not executed
            // if (Number(global.DCX_BALANCE[coin]?.free) > 0 && Number(global.DCX_BALANCE[coin]?.free) < Number(opportunity.qty)) {
            //     if (Number(global.DCX_BALANCE[coin].free) * Number(opportunity.bltp) < 10) return;
            //     let payload = {
            //         side: "sell",
            //         order_type: "market_order",
            //         market: `${coin}USDT`,
            //         total_quantity: Number(global.DCX_BALANCE[coin].free),
            //     };
            //     placeOrder(payload);
            // }
        }, 4000);


        if (!order.id || !global.ONGOING_TRADES[coin]) return;
        global.ONGOING_TRADES[coin].orderId = order.id;
        global.ORDER_IDS[order.id] = {
            executedQuantity: 0,
            total_quantity: order.total_quantity,
        }
        setTimeout(() => {
            delete global.ORDER_IDS[order.id];
        }, 10000);
        global.ONGOING_TRADES[coin].status = "first-leg-placed";
    });
};

module.exports = {
    initReverseFlow,
};
