const { initLogger } = require("./logger");
const { initPrice } = require("./usdt-price.utility")

const initUtilities = () => {
    initPrice();
    initLogger();
}

module.exports = {
    initUtilities
}