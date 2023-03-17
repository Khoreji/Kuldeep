const W3CWebSocket = require('websocket').w3cwebsocket;
const { coins } = require('../../config/dcxCoinList');
let io = require('socket.io-client');
let subscriptions = []
// Spot
const combine_url = 'wss://stream.binance.com:9443/stream?streams=';
module.exports.binanceTrade = async (cb) => {
    let listOfCoins = await coins()
    const depthStream = new W3CWebSocket(`${combine_url}`);
    let count = -1;
    listOfCoins.forEach((coin, index) => {
        if (index % 59 === 0) {
            count = count + 1;
            subscriptions.push([]);
        }
        let prev = subscriptions[count];
        prev.push(`${coin.toLowerCase()}usdt@aggTrade`);
        subscriptions[count] = prev;
    })
    depthStream.onopen = () => {
        subscriptions.forEach(async (subscription) => {
            // Subscribe New connections 
            depthStream.send(JSON.stringify({
                "method": "SUBSCRIBE",
                "params": subscription,
                "id": 1
            }))
        })
    }
    depthStream.onmessage = (e) => {
        let { stream } = JSON.parse(e.data);
        if (stream) {
            let pair = stream.substr(0, stream.indexOf('@')).toUpperCase();
            const data = {
                symbol: pair,
            }
            cb(data);
        }
    }
}
