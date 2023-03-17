//socket.io-client

let socketClient = require('socket.io-client');
const { placeOrder } = require('../../../coindcx/api/auth.api');

const socketConfigs = {
    // transports: ['websocket'],
    // reconnection: false,
    // origin: '*',
}

// Socket connection 
let socketUrl = 'http://localhost:3070';
socketClient = socketClient(socketUrl, socketConfigs);


// Initialize balance function
const initBalance = () => {
    socketClient.on('connect', () => {
        console.log('connected to balance socket');
        socketClient.on('balance', (data) => {
            data?.forEach((balance) => {
                if (Number(balance.balance) == 0) return;
                global.DCX_BALANCE[balance.currency] = {
                    free: Number(balance.balance),
                    locked: Number(balance.locked_balance),
                    total: Number(balance.balance) + Number(balance.locked_balance)
                }
            })
        });
    });
    setInterval(() => {
        if (global.DCX_BALANCE['USDT']) {
            // if usdt balance is greater than 2, Sell all USDT
            if (global.DCX_BALANCE['USDT'].free > 2) {
                placeOrder({
                    "side": "sell",
                    "order_type": "limit_order",
                    "market": "USDTINR",
                    "total_quantity": Math.floor(Number(global.DCX_BALANCE['USDT'].free) * 0.995),
                    "price_per_unit": global.USDT_PRICE.sell,
                })
            }
        }
    }, 2000)
}

module.exports = {
    initBalance
}
