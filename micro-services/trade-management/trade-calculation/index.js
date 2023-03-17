const { arbitrage } = require("./algorithm");

const initCalculation = () => {
    global.CUSTOM_EVENT.on("trade-calculate", async (coin) => {
        calculate(coin);
    });

    global.CUSTOM_EVENT.on("recalculate-opportunities", async () => {
        recalculateOpportunities();
    });

};


const calculate = async (coin) => {

    if (!global.BINANCE_DEPTH[coin] || !global.DCX_DEPTH[coin]) return;
    let t1 = performance.now();
    let t0 = Math.max(global.BINANCE_DEPTH[coin]?.t0, global.DCX_DEPTH[coin]?.t0)
    // console.log(`Rms check: ${t1 - t0} ms`);
    if (global.ONGOING_TRADES[coin]) {
        // global.CUSTOM_EVENT.emit('log', {
        //     level: 'error',
        //     message: `${coin} is already in the order flow`
        // })
        return
    };
    let margin = global.TRADE_MARGINS[coin] || global.TRADE_MARGINS.default;
    // @Arbitrage Parameters
    const arbParams = {
        binanceFee: global.EXCHANGE_FEES.binance,
        exchangeFee: global.EXCHANGE_FEES.dcx,
        buyPrice: global.USDT_PRICE.buy,
        sellPrice: global.USDT_PRICE.sell,
        binance_book: global.BINANCE_DEPTH[coin],
        exchange_book: global.DCX_DEPTH[coin],
        marginStraight: margin.straight,
        marginReverse: margin.reverse,
    };

    let trade = arbitrage(arbParams);

    // INR Worth of trade should be greater than 1000
    let tradeInrWorth = trade?.fp * trade?.qty;
    let tradeType = trade?.type === 'buy' ? 'reverse' : 'straight';
    // INR Profit should be greater than DEFAULT_INR_PROFIT
    // Profit should be greater than the margin of respective trade type
    if (trade?.profit > global.TRADE_MARGINS.INR_PROFIT && tradeInrWorth > 1000 && Number(trade?.profit_per) > Number(margin[tradeType])) {
        // trade.t0 = t0;
        trade.type = tradeType;
        trade.time = new Date().toLocaleString();
        console.clear();
        global.CUSTOM_EVENT.emit('log', {
            level: 'success',
            message: trade
        })
        // trade.t1 = performance.now();
        if (global.huobiCoins.includes(coin)) {
            // console.log("huobi", arbParams)
            console.log("trade", trade)

        }
        global.CUSTOM_EVENT.emit("opportunity-found", trade);
        // global.EXCHANGE_DEPTH[coin] = trade.depth;
        setTimeout(() => {
            global.EXCHANGE_DEPTH[coin] = 0;
        }, 6000);

    }
};

const recalculateOpportunities = async () => {
    Object.keys(global.BINANCE_DEPTH).forEach((coin) => {
        calculate(coin);
    });
};

module.exports = {
    initCalculation,
};