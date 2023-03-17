const calculatorHandler = require("./calculator.posttrade");
const {
    multipleOrderStatus,
    cancelOrder,
} = require("../../../coindcx/api/auth.api");

const initPostTrade = () => {
    // Post trade logic goes here
    global.CUSTOM_EVENT.on("post-trade-calculate", (data) => {
        setTimeout(async () => {
            let trades = await multipleOrderStatus(data);
            if(Object.keys(trades).length === 0) {
                return;
            }
            let btlp = 0;
            let eltp = 0;
            let coin = "";
            let type = "";
            trades?.forEach((order) => {
                if (order.market.includes("USDT")) {
                    coin = order.market.split("USDT")[0];
                    btlp = order.avg_price;
                    let tradePercent =
                        (Number(order.remaining_quantity) /
                            Number(order.total_quantity)) *
                        100;
                    if (tradePercent !== 100) {
                        if (tradePercent > 99) {
                            cancelOrder(order.id);
                        }
                    }
                } else if (order.market.includes("INR")) {
                    coin = order.market.split("INR")[0];
                    let tradePercent =
                        (Number(order.remaining_quantity) /
                            Number(order.total_quantity)) *
                        100;
                    if (tradePercent !== 100) {
                        if (tradePercent > 99) {
                            cancelOrder(order.id);
                        }
                    }
                    if (order.side == "buy") {
                        type = "reverse";
                    } else {
                        type = "straight";
                    }
                    eltp = order.avg_price;
                }
            });
            let calc = calculatorHandler(
                Number(btlp),
                Number(eltp),
                Number(global.USDT_PRICE.buy),
                Number(global.USDT_PRICE.sell)
            );
            calc[type] = Number(calc[type]).toFixed(2);
            if (calc[type] > 0.0) {
                if (
                    calc[type] > Number(global.TRADE_MARGINS["default"][type])
                ) {
                    global.CUSTOM_EVENT.emit("log", {
                        level: "success",
                        message: `Trade profit for ${coin} is ${calc[type]}%`,
                    });
                }
                //else if slipperage is less than 0.2% then reset the margin for that coin
                else if (
                    Number(calc[type]) >
                    Number(global.TRADE_MARGINS["default"][type]) - 0.2
                ) {
                    global.TRADE_MARGINS[coin] = {};
                    global.TRADE_MARGINS[coin] = {
                        straight: global.TRADE_MARGINS["default"]["straight"],
                        reverse: global.TRADE_MARGINS["default"]["reverse"],
                    };
                    // Reset the margin for that coin to default after 20 seconds
                    setTimeout(() => {
                        delete global.TRADE_MARGINS[coin];
                    }, 10000);
                    global.TRADE_MARGINS[coin][type] = (Number(calc[type]) + 0.2).toFixed(2);

                    global.CUSTOM_EVENT.emit("log", {
                        level: "error",
                        message: `Trade margin for ${coin} is ${calc[type]}% resetting to ${global.TRADE_MARGINS[coin][type]}%`,
                    });
                } else {
                    global.CUSTOM_EVENT.emit("log", {
                        level: "error",
                        message: `Trade loss for ${coin} is ${calc[type]}% stopping the trade for ${coin}`,
                    });

                    // Stop the trade for that coin
                    global.MALFUNCTIONING_COINS.push(coin.toUpperCase());
                    setTimeout(() => {
                        global.MALFUNCTIONING_COINS = global.MALFUNCTIONING_COINS.filter(
                            (c) => c !== coin.toUpperCase()
                        );
                    }, 10000);
                }
            }
        }, 3000);
    });
};

module.exports = {
    initPostTrade,
};
