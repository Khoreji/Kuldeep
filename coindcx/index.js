const { initMarketData } = require("./api/public.api");
const { initBooks, initHuobiDepth } = require("./streams/depth.stream");

const initDcx = () => {
    initBooks();
    initMarketData();
    initHuobiDepth();
}

module.exports = {
    initDcx
}