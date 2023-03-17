const { dcxAuthApi } = require("../../utility/api.utility");

//Get balance of all coins from DCX
const getDcxBalance = async () => {
    try {
        const body = {
            "timestamp": Date.now()
        }
        const response = await dcxAuthApi('POST', '/exchange/v1/users/balances', body);
        const { data } = response;
        return data;
    } catch (error) {
        // console.log(error);
    }
}

module.exports = {
    getDcxBalance
}