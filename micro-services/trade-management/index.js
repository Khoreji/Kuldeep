// global imports
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socketNew")(http);
const port = 3072;
const cors = require("cors");
//IMPORT EXEC 
const { exec } = require("child_process");

app.use(cors());
app.use(express.json());

// internal imports
const { initBinance } = require("../../binance");
const { EventEmitter } = require("events");
const { initCalculation } = require("./trade-calculation");
const { initDcx } = require("../../coindcx");
const { initUtilities } = require("../../utility");
const { initOrderFlow } = require("./order-flow");
const { initBalance } = require("./balance-manager");
const { initRiskManagement } = require("../risk-management-system");
const { placeOrder } = require("../../coindcx/api/auth.api");
const { initSocket } = require("./socket-manager");
require("../../config/exchangesFees");

// INITIALIZING GLOBAL VARIABLES

// Global variable to store depth of each exchange
global.BINANCE_DEPTH = {};
global.DCX_DEPTH = {};

// Global variable to store USDT price
global.USDT_PRICE = {
    buy: 150,
    sell: 50,
};

// Global variable to store margin for each coin
global.TRADE_MARGINS = {
    INR_PROFIT: 20,
    default: {
        straight: 3.2,
        reverse: 3.2,
    },
};
// Global variable to store all the coins which are not working properly
global.MALFUNCTIONING_COINS = [];

// global event emitters
global.CUSTOM_EVENT = new EventEmitter();

// global variable to store ongoing trades and their status
global.ONGOING_TRADES = {};

// global variable to store the balance of each coin
global.DCX_BALANCE = {};

// global variable to store the market info
global.DCX_MARKET_INFO = {};

// global variable to store the last trades
global.LAST_TRADE = {};

//global Socket
global.SOCKET = {
    init: false,
};

// global variable to store the order ids
global.ORDER_IDS = {};

// global variable for front end error
global.FRONT_END_ERROR = {};

// global variable for last quantity deviation
global.LAST_QTY_DEVIATION = 1;

// global variable for last qty trade
global.LAST_QTY_TRADE = {};

// global depth variable
global.EXCHANGE_DEPTH = {};

// global variable for diff book
global.globalBook = {};

// global variable for time
global.TIME = "";

setInterval(() => {
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
    global.TIME = time;
}, 1000);

//{
// head: "",
// body: "",
// }

// API to stop all pm2 processes
app.get("/stop", (req, res) => {
    res.send("Stopping all processes");
    exec("pm2 stop all", (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
    }
    )
});

// initialization
const init = async () => {
    initBinance();
    initDcx();
    initCalculation();
    initUtilities();
    initOrderFlow();
    initBalance();
    initRiskManagement();
};

init();

// socket io
io.on("connection", function (socket) {
    // console.log("a user connected");
    global.SOCKET = {
        init: true,
        socket,
    };

    initSocket();

    socket.on("disconnect", function () {
        // console.log("user disconnected");
    });
});

http.listen(port, function () {
    // console.log(`Listening on ${port}`);
});
