//express server with socket.io
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { getDcxBalance } = require("./balance.account");

const port = 3070;
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

let balanceInterval = null;

io.on('connection', (socket) => {
    console.log('a user connected');
    clearInterval(balanceInterval);
    balanceInterval = setInterval(async () => {
        const balance = await getDcxBalance();
        socket.emit('balance', balance);
    }, 1000);
    socket.on('disconnect', () => {
    });
});


server.listen(port, () => {
    console.log(`listening on *:${port}`);
});