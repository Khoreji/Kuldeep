import io from "socket.io-client";
const socket = io("http://13.235.65.255:3052", {
    transports: ['websocket'],
    upgrade: true
});
socket.on("connect", () => {

});

export default socket;
