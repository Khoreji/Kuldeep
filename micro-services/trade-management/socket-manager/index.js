const { coins } = require("../../../config/dcxCoinList");

let interval;
let updateTime = {};

let coinStatus = {};

const initSocket = async () => {
    clearInterval(interval);
    let coinList = await coins();
    if (global.SOCKET.init) {
        global.SOCKET.socket.emit("coin-list", coinList);
    }
    interval = setInterval(() => {
        coinList.forEach((coin) => {
            updateTime[coin] = [
                global?.BINANCE_DEPTH[coin]?.time || "NA",
                global?.DCX_DEPTH[coin]?.time || "NA",
            ];
            coinStatus[coin] = "active";
            if (global.ONGOING_TRADES[coin]) {
                coinStatus[coin] = "pending";
            }
            if (global.MALFUNCTIONING_COINS.includes(coin)) {
                coinStatus[coin] = "inactive";
            }
        });
        global.SOCKET.socket.emit("update-time", updateTime);
        global.SOCKET.socket.emit("margins", global.TRADE_MARGINS);
        global.SOCKET.socket.emit("coin-status", coinStatus);
        global.SOCKET.socket.emit("balance", global.DCX_BALANCE);
        global.SOCKET.socket.emit("usdt-price", global.USDT_PRICE);
        global.SOCKET.socket.emit("FE-error", global.FRONT_END_ERROR);
    }, 1000);
};

module.exports = {
    initSocket,
};
