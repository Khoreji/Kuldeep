const W3CWebSocket = require("websocket").w3cwebsocket;
const { coins } = require("../../config/dcxCoinList");
let io = require("socket.io-client");
let axios = require("axios");
let baseUrl = "https://api.binance.com/api/v3/depth";

const getBook = (symbol, cb) => {
    let url = baseUrl + "?symbol=" + symbol + "USDT&limit=30";
    axios
        .get(url)
        .then((response) => {
            cb(response.data);
        })
        .catch((error) => { });
};
let subscriptions = [];

let lastUpdateId = {};
// Spot
const combine_url = "wss://stream.binance.com:9443/stream?streams=";
const depthStream = new W3CWebSocket(`${combine_url}`);

let bookCount = 0;

let timeouts = {};
let intervals = {};

setInterval(() => {
    bookCount++;
    if (bookCount === 10) {
        global.CUSTOM_EVENT.emit("log", {
            level: "error",
            message: "Websocket connection lost for Binance Depth",
        });

        global.FRONT_END_ERROR[`B_DIFF`] = {
            head: `Global | Order Book | ${global.TIME}`,
            body: `Binance Diff: global.globalBook is not updating`,
        }
    }
    else if (bookCount < 10) {
        delete global.FRONT_END_ERROR[`B_DIFF`];
    }
}, 1000);

module.exports.binanceDiff = async () => {
    let listOfCoins = await coins();
    listOfCoins.forEach((coin, index) => {
        setTimeout(() => {
            getBook(coin, (data) => {
                global.globalBook[coin] = data;
                global.globalBook[coin].symbol = `${coin}USDT`;
            });
        }, 150 * index);
    });
    setInterval(() => {
        listOfCoins.forEach((coin, index) => {
            setTimeout(() => {
                getBook(coin, (data) => {
                    global.globalBook[coin] = data;
                    global.globalBook[coin].symbol = `${coin}USDT`;
                });
            }, 1200 * index);
        });
    }, 1000 * 60 * 3);
    let count = -1;
    listOfCoins.forEach((coin, index) => {
        if (index % 59 === 0) {
            count = count + 1;
            subscriptions.push([]);
        }
        let prev = subscriptions[count];
        prev.push(`${coin.toLowerCase()}usdt@depth@100ms`);
        subscriptions[count] = prev;
    });
    depthStream.onopen = () => {
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
        if (e.data) {
            bookCount = 0;
            let data = JSON.parse(e.data);
            if (data.stream && data.stream.includes("@depth@100ms")) {
                let coin = data.stream.split("@")[0].toUpperCase();
                buildBook({
                    coin,
                    data: data.data,
                });
            }
        }
    };
};

const buildBook = (data) => {
    // console.log(data);
    let coin = data.data.s;
    let newBook = data.data;
    _luIDDiff = {
        [coin]: data.data.u,
    };
    if (
        !lastUpdateId[coin] ||
        lastUpdateId[coin] === 0 ||
        data.data.U === lastUpdateId[coin]
    ) {
        lastUpdateId[coin] = data.data.u + 1;
    } else {
        getBook(coin, (data) => {
            global.globalBook[coin] = data;
            global.globalBook[coin].symbol = `${coin}USDT`;
        });
    }
    if (global.globalBook[coin]) {
        global.globalBook[coin].lastUpdateId = data.data.u;
        if (newBook.a.length > 0) {
            for (let i = 0; i < newBook.a.length; i++) {
                let oldAsks = global.globalBook[coin].asks;
                let oldAsksArr = [];
                oldAsks.forEach((ask, index) => {
                    oldAsksArr.push(Number(ask[0]));
                });

                if (oldAsksArr.includes(Number(newBook.a[i][0]))) {
                    let index = oldAsksArr.indexOf(Number(newBook.a[i][0]));
                    //if new quantity is 0, remove from array
                    if (Number(newBook.a[i][1]) === 0) {
                        global.globalBook[coin].asks.splice(index, 1);
                    }
                    //if new quantity is not 0, update quantity
                    else {
                        global.globalBook[coin].asks[index][1] = newBook?.a?.[i]?.[1];
                    }
                }
                //if new price is not in array, add to global.globalBook and sort
                else {
                    //if new quantity is 0, do not add to array
                    if (Number(newBook.a[i][1]) === 0) {
                        continue;
                    }
                    global.globalBook[coin].asks.push(newBook.a[i]);
                    global.globalBook[coin].asks.sort((a, b) => {
                        return Number(a[0]) - Number(b[0]);
                    });
                }
            }
        }
        if (newBook.b.length > 0) {
            for (let i = 0; i < newBook.b.length; i++) {
                let oldBids = global.globalBook[coin].bids;
                let oldBidsArr = [];
                oldBids.forEach((bid, index) => {
                    oldBidsArr.push(Number(bid[0]));
                });

                if (oldBidsArr.includes(Number(newBook.b[i][0]))) {
                    let index = oldBidsArr.indexOf(Number(newBook.b[i][0]));
                    //if new quantity is 0, remove from array
                    if (Number(newBook.b[i][1]) === 0) {
                        global.globalBook[coin].bids.splice(index, 1);
                    }
                    //if new quantity is not 0, update quantity
                    else {
                        global.globalBook[coin].bids[index][1] = newBook?.b?.[i]?.[1];
                    }
                }
                //if new price is not in array, add to global.globalBook and sort
                else {
                    //if new quantity is 0, do not add to array
                    if (Number(newBook.b[i][1]) === 0) {
                        continue;
                    }
                    global.globalBook[coin].bids.push(newBook.b[i]);
                    global.globalBook[coin].bids.sort((a, b) => {
                        return Number(b[0]) - Number(a[0]);
                    });
                }
            }
        }
    }
    let currentLastUpdatedID =
        global.BINANCE_DEPTH?.[coin.substring(0, coin.length - 4)]
            ?.lastUpdateId;
    if (
        !currentLastUpdatedID ||
        currentLastUpdatedID <
        global.globalBook[coin.substring(0, coin.length - 4)]?.lastUpdateId
    ) {
        if (global.globalBook[coin.substring(0, coin.length - 4)]) {
            if (intervals[coin.substring(0, coin.length - 4)]) {
                //limit asks and bids to 10
                global.BINANCE_DEPTH[coin.substring(0, coin.length - 4)] = {
                    ...global.globalBook[coin.substring(0, coin.length - 4)],
                    asks: global.globalBook[coin.substring(0, coin.length - 4)].asks.slice(
                        0,
                        10
                    ),
                    bids: global.globalBook[coin.substring(0, coin.length - 4)].bids.slice(
                        0,
                        10
                    ),
                };
                global.BINANCE_DEPTH[coin.substring(0, coin.length - 4)].source =
                    "Diff";
            }
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
            if (global?.BINANCE_DEPTH[coin]?.timeStamp) {
                // Check if the difference between the current time and the last time the data was updated is greater than 5 seconds
                if (
                    Date.now() - global.BINANCE_DEPTH[coin].timeStamp >
                    5000
                ) {
                    // If yes, then emit a warning
                    global.CUSTOM_EVENT.emit("log", {
                        level: "warn",
                        message: `Binance Diff: ${coin} is not updating`,
                    });

                    global.FRONT_END_ERROR[`${coin}_B_DIFF`] = {
                        head: `${coin} | Order Book | ${global.TIME}`,
                        body: `Binance Diff: ${coin} is not updating`,
                    }
                }
                else {
                    delete global.FRONT_END_ERROR[`${coin}_B_DIFF`]
                }
            }

            if (global.BINANCE_DEPTH[coin]) {
                global.BINANCE_DEPTH[coin].time = time;
                global.BINANCE_DEPTH[coin].timeStamp = Date.now();
            }
            // set interval to call api every second.

            intervals[coin.substring(0, coin.length - 4)] = setInterval(() => {
                clearInterval(intervals[coin.substring(0, coin.length - 4)]);
                delete intervals[coin.substring(0, coin.length - 4)];
                getBook(coin.substring(0, coin.length - 4), (data) => {
                    global.globalBook[coin.substring(0, coin.length - 4)] = data;
                    global.globalBook[coin.substring(0, coin.length - 4)].symbol = `${coin.substring(
                        0,
                        coin.length - 4
                    )}USDT`;
                });
            }, 1000);

            // set timeout to clear interval after 10 seconds
            timeouts[coin.substring(0, coin.length - 4)] = setTimeout(() => {
                clearTimeout(timeouts[coin.substring(0, coin.length - 4)]);
                clearInterval(intervals[coin.substring(0, coin.length - 4)]);
                delete intervals[coin.substring(0, coin.length - 4)];
                delete timeouts[coin.substring(0, coin.length - 4)];
            }, 10000);
        }
    }
};

module.exports.resubsribeDiff = async (coin) => {
    try {
        depthStream.send(
            JSON.stringify({
                method: "UNSUBSCRIBE",
                params: [`${coin.toLowerCase()}usdt@depth@100ms`],
                id: 312,
            })
        );
        depthStream.send(
            JSON.stringify({
                method: "SUBSCRIBE",
                params: [`${coin.toLowerCase()}usdt@depth@100ms`],
                id: 1,
            })
        );
    } catch (e) { }
};
