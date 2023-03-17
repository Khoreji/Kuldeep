const depthBook = require('./streams/depth.stream');
const diffBook = require('./streams/diff.stream');
const trades = require('./streams/trades.stream');
const initBinance = () => {
    diffBook.binanceDiff();
    depthBook.BINANCE_DEPTH();
}

module.exports = {
    initBinance
}