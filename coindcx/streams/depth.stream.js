//For coin dcx websocket
//Socket io client version: 2.4.0
let socketClient = require('socket.io-client');
let huobiClient = require('socket.io-client');
const { coins } = require('../../config/dcxCoinList');
const socketUrl = 'https://stream.coindcx.com';
const crypto = require('crypto');
const credentials = require("../../config/cred.config");
const W3CWebSocket = require("websocket").w3cwebsocket;
var enc = new TextDecoder("utf-8");
const body = { channel: "coindcx" };
const payload = Buffer.from(JSON.stringify(body)).toString();
const signature = crypto.createHmac('sha256', credentials['dcx-secret']).update(payload).digest('hex')
//Socket configs
const socketConfigs = {
    transports: ['websocket'],
    reconnection: false,
    origin: '*',
}

let huobiCoins = [
    // 'DAO', 'TLOS',
    // 'PUSH', 'GARI',
    // 'XCN', 'SNT',
    // 'ARV', 'VINU',
    // 'EFI', 'FANC',
    // 'BRISE', 'XDC'
]

global.huobiCoins = huobiCoins;

let i = 0;
let dataInterval;
//Socket connection
module.exports.initBooks = async () => {
    socketClient = socketClient(socketUrl, socketConfigs);
    // socketClient.connect();
    clearInterval(dataInterval);
    dataInterval = setInterval(() => {
        i = i + 1;
        if (i >= 10) {
            i = 0;
            global.FRONT_END_ERROR[`DCX_DEPTH`] = {
                head: `Global | Order Book | ${global.TIME}`,
                body: `DCX Depth: globalBook is not updating`,
            }
            socketClient.disconnect();
            socketClient.connect();
        }
        else {
            delete global.FRONT_END_ERROR[`DCX_DEPTH`];
        }
    }, 1000);
    socketClient.on('connect', async () => {

        // Global logger event

        global.CUSTOM_EVENT.emit('log', {
            level: 'init',
            message: 'Websocket connection established for CoinDCX Depth'
        })

        let coinsList = await coins()
        coinsList.forEach((coin) => {
            socketClient.emit('join', {
                'channelName': `I-${coin}_INR`,
            });
        })
        socketClient.emit('join', {
            'channelName': "coindcx",
            'authSignature': signature,
            'apiKey': credentials['dcx-key'],
        });
        socketClient.on('depth-update', (response) => {
            i = 0;
            let data = JSON.parse(response.data),
                coin = data.channel.substr(data.channel.indexOf('-') + 1, data.channel.indexOf('_') - 2),
                pair = `${coin}-INR`;
            //sort data.a in ascending order
            data.a.sort((a, b) => {
                return a[0] - b[0];
            });
            //sort data.b in descending order
            data.b.sort((a, b) => {
                return b[0] - a[0];
            });
            //only keep top 10 bids and asks
            let asks = data.a.slice(0, 10);
            let bids = data.b.slice(0, 10);
            let bookData = {
                coin,
                pair,
                asks,
                bids,
                t0: performance.now()
            }
            global.DCX_DEPTH[coin] = bookData;
            global.DCX_DEPTH[coin].source = 'Depth';
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
            global.DCX_DEPTH[coin].time = time;
            if (global.EXCHANGE_DEPTH[coin] && global.EXCHANGE_DEPTH[coin] > 0) {
                // decrease the depth by 1
                global.EXCHANGE_DEPTH[coin] = global.EXCHANGE_DEPTH[coin] - 1;
                return;
            }
            global.CUSTOM_EVENT.emit('trade-calculate', coin);
        });
        let timeouts = {};
        socketClient.on("order-update", (response) => {
            let data = JSON.parse(response?.data)?.[0];
            // custom order update event for second leg order
            let coin = data?.target_currency_short_name;
            if (coin) {
                if (global.ORDER_IDS[data?.id]) {
                    console.log('order update', data);
                    global.EXCHANGE_DEPTH[coin] += 1;
                    delete timeouts[coin];
                    timeouts[coin] = setTimeout(() => {
                        global.EXCHANGE_DEPTH[coin] = 0;
                    }, 10000);
                    // global.ONGOING_TRADES[coin].t5 = performance.now();
                    global.CUSTOM_EVENT.emit('order-update', data);
                }
            }
        })
    })
}


// Huobi Depth Stream

module.exports.initHuobiDepth = async () => {

}
