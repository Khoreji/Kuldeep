const straightBinanceBreakPointCalculate = (ELTP, buy_price, margin, exchangeFee, binanceFee) => {
    let breakpoint = ((ELTP * (1 - exchangeFee)) / (buy_price * (1 + exchangeFee) * (1 + binanceFee))) * ((100 + margin) / 100);
    return breakpoint;
}

const reverseBinanceBreakPointCalculate = (ELTP, sell_price, margin, exchangeFee, binanceFee) => {
    let breakpoint = ((ELTP * (1 + exchangeFee)) / (sell_price * (1 - exchangeFee) * (1 + binanceFee))) * (100 / (100 + margin))
    return breakpoint;
}

const straightExchangeBreakPointCalculate = (BLTP, buy_price, margin, exchangeFee, binanceFee) => {
    let breakpoint = (buy_price * (1 + exchangeFee)) * (BLTP * (1 + binanceFee));
    breakpoint = ((1 + margin / 100) * breakpoint) / (1 - exchangeFee);
    return breakpoint;
}

const reverseExchangeBreakPointCalculate = (BLTP, sell_price, margin, exchangeFee, binanceFee) => {
    let breakpoint = (sell_price * BLTP) / ((1 + margin / 100));
    return breakpoint;
}
//straightcalculate
const straightCalulate = (
    E_USDTINRWithFee,
    B_USDTCoinWithFee,
    E_FeeDeduct,
    Eltp
) => {
    let imputeINR = E_USDTINRWithFee * B_USDTCoinWithFee;
    let straight = ((Eltp * E_FeeDeduct - imputeINR) / imputeINR) * 100;
    return { imputeINR, straight };
};

//reverse calculate
const reverseCalulate = (
    Eltp,
    E_FeeAdd,
    Bltp,
    B_FeeDeduct,
    sellPriceOfUSDTINR,
    E_FeeDeduct
) => {
    let usdtCost = ((Eltp * E_FeeAdd) / Bltp) * B_FeeDeduct;
    let reverse =
        (((sellPriceOfUSDTINR * E_FeeDeduct) - usdtCost) / usdtCost) * 100;
    return { usdtCost, reverse };
};

module.exports.arbitrage = (params) => {
    const { binanceFee, exchangeFee, buyPrice, binance_book, exchange_book, sellPrice, marginStraight, marginReverse } = params;

    let exchangeFeeAdd = 1 + exchangeFee / 100,
        binanceFeeAdd = 1 + binanceFee / 100,
        exchangeFeeDeduct = 1 - exchangeFee / 100,
        binanceFeeDeduct = 1 - binanceFee / 100,
        _exchangeFee = exchangeFee / 100,
        _binanceFee = binanceFee / 100;

    let trade = {
        type: '',
        coin: '',
        qty: '',
        bltp: '',
        fp: '',
        profit: '',
        profit_per: ''
    };
    trade.coin = binance_book.symbol;
    let usdtBuyPriceWithFee = Number(buyPrice) * exchangeFeeAdd;

    let binanceTopAskPrice = Number(binance_book.asks[0][0]),
        binanceTopBidPrice = Number(binance_book.bids[0][0]);


    // Depth of exchange
    let exchangeDepth = {
        ask: 0,
        bid: 0
    };

    // Depth of binance
    let binanceDepth = {
        ask: 0,
        bid: 0
    };

    // Straight and reverse Calculation for break point IN EXCHANGE
    let reverseExchangeBreakPoint = reverseExchangeBreakPointCalculate(binanceTopBidPrice, sellPrice, marginReverse, _exchangeFee, _binanceFee);
    let straightExchangeBreakPoint = straightExchangeBreakPointCalculate(binanceTopAskPrice, buyPrice, marginStraight, _exchangeFee, _binanceFee);

    let exchange_ask_break = false,
        exchange_bid_break = false;

    let exchange_floorPrice = 0;

    let z_askPriceAmountAftreMulti = 0,
        z_askCumulativeAmount = 0,
        z_bidPriceAmountAftreMulti = 0,
        z_bidCumulativeAmount = 0;

    let exchangeBookAsks = exchange_book.asks,
        binanceBookAsks = binance_book.asks,
        exchangeBookBids = exchange_book.bids,
        binanceBookBids = binance_book.bids;

    for (let i = 0; i < exchangeBookAsks?.length; i++) {
        let e_ask_price = Number(exchangeBookAsks[i]?.[0]);
        if (exchangeBookAsks
            && i < exchangeBookAsks.length
            && !exchange_ask_break
            && reverseExchangeBreakPoint >= e_ask_price) {

            let amount = parseFloat(exchangeBookAsks[i]?.[1]); // TODO: divide by decimal
            exchange_floorPrice = e_ask_price;
            z_askPriceAmountAftreMulti =
                z_askPriceAmountAftreMulti + amount * exchange_floorPrice;
            z_askCumulativeAmount = z_askCumulativeAmount + amount;
            exchangeDepth.ask = i;
        } else {
            exchange_ask_break = true;
        }

        if (exchangeBookBids
            && i < exchangeBookBids.length
            && !exchange_bid_break
            && straightExchangeBreakPoint <= exchangeBookBids[i]?.[0]) {

            let amount = Number(exchangeBookBids[i]?.[1]); // TODO: divide by decimal
            exchange_floorPrice = Number(exchangeBookBids[i]?.[0]);
            z_bidPriceAmountAftreMulti = z_bidPriceAmountAftreMulti + amount * exchange_floorPrice;
            z_bidCumulativeAmount = z_bidCumulativeAmount + amount;
            exchangeDepth.bid = i;
        } else {
            exchange_bid_break = true
        }
        if (exchange_ask_break && exchange_bid_break) {
            break;
        }
    }
    let t1 = performance.now();
    let t0 = Math.max(exchange_book.t0, binance_book.t0);

    // console.log("breakpoint time: " + (t1 - t0) + " milliseconds.");

    let exchangeAskWap = z_askPriceAmountAftreMulti / z_askCumulativeAmount || 0,
        exchangeBidWap = z_bidPriceAmountAftreMulti / z_bidCumulativeAmount || 0,
        b_AskWap = 0,
        b_BidWap = 0;

    // Straight and Reverse Calculation for break point IN BASE EXCHANGE
    let straightBinanceBreakPoint = straightBinanceBreakPointCalculate(exchangeBidWap, buyPrice, marginStraight, _exchangeFee, _binanceFee); // TODO: currently margin is hardcoded
    let reverseBinanceBreakPoint = reverseBinanceBreakPointCalculate(exchangeAskWap, sellPrice, marginReverse, _exchangeFee, _binanceFee); // TODO: currently margin is hardcoded
    // Binance Wap Calculating
    let binanceAskCumulativeQty = 0,
        binanceBidCumulativeQty = 0,
        binanceAskPriceAmountAfterMulti = 0,
        binanceBidPriceAmountAfterMulti = 0,
        binance_floorPrice = 0;

    if (z_askCumulativeAmount > 0) {
        // Reverse Calculate
        for (let i = 0; i < binanceBookBids.length; i++) {
            if (reverseBinanceBreakPoint <= Number(binanceBookBids[i][0])
                && z_askCumulativeAmount >= binanceBidCumulativeQty) {
                binance_floorPrice = binanceBookBids[i][0];
                binanceBidCumulativeQty = binanceBidCumulativeQty + Number(binanceBookBids[i][1]);
                binanceBidPriceAmountAfterMulti = binanceBidPriceAmountAfterMulti + Number(binanceBookBids[i][1]) * binance_floorPrice;
                b_BidWap = binanceBidPriceAmountAfterMulti / binanceBidCumulativeQty;
            }
            else {
                break
            }
        }
        let profitMargin = reverseCalulate(
            exchangeAskWap,
            exchangeFeeAdd,
            Number(b_BidWap),
            binanceFeeDeduct,
            sellPrice,
            exchangeFeeDeduct);

        let qty = Math.min(z_askCumulativeAmount, binanceBidCumulativeQty)
        let USDTCost = profitMargin.usdtCost,
            askDivident = sellPrice * exchangeFeeDeduct - USDTCost,
            askProfitPercentage = (askDivident / USDTCost) * 100,
            askProfit = (askProfitPercentage * qty * exchangeAskWap) / 100;
        trade.type = 'buy';
        trade.qty = qty;
        trade.bltp = Number(b_BidWap);
        trade.fp = exchange_floorPrice;
        trade.profit = askProfit;
        trade.profit_per = askProfitPercentage;
        trade.buyPrice = buyPrice;
        trade.sellPrice = sellPrice;
        trade.bWAP = b_AskWap;
        trade.eWAP = exchangeBidWap;
        trade.depth = exchangeDepth.ask;
    }
    if (z_bidCumulativeAmount > 0) {
        for (let i = 0; i < 10; i++) {
            if (straightBinanceBreakPoint >= Number(binanceBookAsks[i][0])
                && z_bidCumulativeAmount >= binanceAskCumulativeQty) {
                binance_floorPrice = binanceBookAsks[i][0];
                binanceAskCumulativeQty = binanceAskCumulativeQty + Number(binanceBookAsks[i][1]);
                binanceAskPriceAmountAfterMulti = binanceAskPriceAmountAfterMulti + Number(binanceBookAsks[i][1]) * binance_floorPrice;
                b_AskWap = binanceAskPriceAmountAfterMulti / binanceAskCumulativeQty;
            } else {
                break
            }
        }
        let qty = Math.min(z_bidCumulativeAmount, binanceAskCumulativeQty)
        let profitMargin = straightCalulate(usdtBuyPriceWithFee, (b_AskWap * binanceFeeAdd), exchangeFeeDeduct, exchangeBidWap);
        // Straight
        let bidDivident = exchangeBidWap * exchangeFeeDeduct - profitMargin.imputeINR,
            bidProfit = bidDivident * qty;
        trade.type = 'sell';
        trade.qty = qty;
        trade.bltp = Number(binance_floorPrice);
        trade.fp = exchange_floorPrice;
        trade.profit = bidProfit;
        trade.profit_per = profitMargin.straight;
        trade.buyPrice = buyPrice;
        trade.sellPrice = sellPrice;
        trade.bWAP = b_AskWap;
        trade.eWAP = exchangeBidWap;
        trade.depth = exchangeDepth.bid;
    }

    let t2 = performance.now();
    // console.log("calc time: " + (t2 - t1) + " milliseconds.");
    return trade
}