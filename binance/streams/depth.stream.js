const W3CWebSocket = require("websocket").w3cwebsocket;
const { coins } = require("../../config/dcxCoinList");
let io = require("socket.io-client");
let subscriptions = [];
// Spot
const combine_url = "wss://stream.binance.com:9443/stream?streams=";
let depthStream = new W3CWebSocket(`${combine_url}`);
depthStream.onerror = () => {
    console.log("Connection Error");
};

let bookCount = 0;

setInterval(() => {
    bookCount++;
    if (bookCount === 10) {
        global.CUSTOM_EVENT.emit("log", {
            level: "error",
            message: "Websocket connection lost for Binance Depth",
        });
        global.FRONT_END_ERROR[`B_DEPTH`] = {
            head: `Global | Order Book | ${global.TIME}`,
            body: `Binance Depth: globalBook is not updating`,
        }
    }
    else if (bookCount < 10) {
        delete global.FRONT_END_ERROR[`B_DEPTH`];
    }
}, 1000);

const BINANCE_DEPTH = async () => {
    let listOfCoins = await coins();
    let count = -1;
    listOfCoins.forEach((coin, index) => {
        if (index % 59 === 0) {
            count = count + 1;
            subscriptions.push([]);
        }
        let prev = subscriptions[count];
        prev.push(`${coin.toLowerCase()}usdt@depth10@100ms`);
        subscriptions[count] = prev;
    });
    depthStream.onopen = () => {
        // Global Logger event
        global.CUSTOM_EVENT.emit("log", {
            level: "init",
            message: "Websocket connection established for Binance Depth",
        });

        subscriptions.forEach(async (subscription) => {
            // Subscribe New connections
            depthStream.send(
                JSON.stringify({
                    method: "SUBSCRIBE",
                    params: subscription,
                    id: 1,
                })
            );
        });
    };
    depthStream.onmessage = (e) => {
        let { stream } = JSON.parse(e.data);
        if (stream) {
            bookCount = 0;
            const { asks, bids, lastUpdateId } = JSON.parse(e.data).data;
            let pair = stream.substr(0, stream.indexOf("@")).toUpperCase();
            const data = {
                symbol: pair,
                asks: asks,
                bids: bids,
                lastUpdateId,
                t0: performance.now(),
            };
            let coin = pair.split("USDT")[0].toUpperCase();
            global.BINANCE_DEPTH[coin] = data;
            global.BINANCE_DEPTH[coin].source = "Depth";
            var today = new Date(
                new Date().toLocaleString("en-US", {
                    timeZone: "Asia/Kolkata",
                })

            );
            var time =
                today.getHours() +
                ":" +
                today.getMinutes() +
                ":" +
                today.getSeconds();
            global.BINANCE_DEPTH[coin].time = time;

            if (global.BINANCE_DEPTH[coin]?.timeStamp) {
                // Check if the difference between the current time and the last time the data was updated is greater than 5 seconds
                if (
                    Date.now() - global.BINANCE_DEPTH[coin].timeStamp >
                    5000
                ) {
                    // If yes, then emit a warning
                    global.CUSTOM_EVENT.emit("log", {
                        level: "warn",
                        message: `Binance Depth: ${coin} is not updating`,
                    });

                    global.FRONT_END_ERROR[`${coin}_B_DEPTH`] = {
                        head: `${coin} | Order Book | ${global.TIME}`,
                        body: `Binance Depth: ${coin} is not updating`,
                    }
                }
                else {
                    delete global.FRONT_END_ERROR[`${coin}_B_DEPTH`];
                }
            }

            if (global.globalBook.lastUpdateId && global.globalBook.lastUpdateId <= global.BINANCE_DEPTH[coin].lastUpdateId) {
                global.CUSTOM_EVENT.emit("Recall-API");
            }
            global.BINANCE_DEPTH[coin].timeStamp = Date.now();

            global.CUSTOM_EVENT.emit("trade-calculate", coin);
        }
    };
};

const resubsribe = async (coin) => {
    depthStream = new W3CWebSocket(`${combine_url}`);
    depthStream.onopen = () => {
        try {
            depthStream.send(
                JSON.stringify({
                    method: "UNSUBSCRIBE",
                    params: [`${coin.toLowerCase()}usdt@depth10@100ms`],
                    id: 312,
                })
            );
            depthStream.send(
                JSON.stringify({
                    method: "SUBSCRIBE",
                    params: [`${coin.toLowerCase()}usdt@depth10@100ms`],
                    id: 1,
                })
            );
        } catch (e) { }
    };
};

module.exports = {
    resubsribe,
    BINANCE_DEPTH,
};
