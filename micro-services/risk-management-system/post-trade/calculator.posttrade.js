let fee = { "globalBinanceFee": 0.09, "globalZebpayInrFee": 0.09, "globalZebpayUsdtFee": 0.09, "globalWazirxFee": 0.09, "globalDcxFee": 0.09 }
let wazirxFeeAdd = 1 + fee.globalWazirxFee / 100,
    wazirxFeeDeduct = 1 - fee.globalWazirxFee / 100,
    zebpayFeeAdd = 1 + fee.globalZebpayInrFee / 100,
    zebpayFeeDeduct = 1 - fee.globalZebpayInrFee / 100,
    binanceFeeAdd = 1 + fee.globalBinanceFee / 100,
    binanceFeeDeduct = 1 - fee.globalBinanceFee / 100;


let OperationableFee = {
    wazirxFeeAdd,
    wazirxFeeDeduct,
    zebpayFeeAdd,
    zebpayFeeDeduct,
    binanceFeeAdd,
    binanceFeeDeduct,
};
let calculatedFee = OperationableFee;
//straightcalculate
const straightCalulate = (
    E_USDTINRWithFee,
    B_USDTCoinWithFee,
    E_FeeDeduct,
    Eltp
) => {
    let imputeINR = E_USDTINRWithFee * B_USDTCoinWithFee;
    let straight = ((Eltp * E_FeeDeduct - imputeINR) / imputeINR) * 100;
    return { imputeINR, straight };
};

//reverse calculate
const reverseCalulate = (
    Eltp,
    E_FeeAdd,
    Bltp,
    B_FeeDeduct,
    sellPriceOfUSDTINR,
    E_FeeDeduct
) => {
    let usdtCost = ((Eltp * E_FeeAdd) / Bltp) * B_FeeDeduct;
    let reverse =
        ((sellPriceOfUSDTINR * E_FeeDeduct - usdtCost) / usdtCost) * 100;
    return { usdtCost, reverse };
};


const calculatorHandler = (bltp, eltp, buyPrice, sellPrice) => {
    let response = {}
    let buyPriceWithFee = parseFloat(buyPrice) * calculatedFee.zebpayFeeAdd,
        BinanceUSDTCoinWithFee = parseFloat(bltp) * calculatedFee.binanceFeeAdd;

    // Straight
    let straight = straightCalulate(
        buyPriceWithFee,
        BinanceUSDTCoinWithFee,
        calculatedFee.zebpayFeeDeduct,
        eltp
    );

    // Reverse
    let reverse_ = reverseCalulate(
        eltp,
        calculatedFee.zebpayFeeAdd,
        bltp,
        calculatedFee.binanceFeeDeduct,
        sellPrice,
        calculatedFee.zebpayFeeDeduct
    );

    response = {
        straight: Number(straight.straight).toFixed(2),
        reverse: Number(reverse_.reverse).toFixed(2),
    }
    return response
}

module.exports = calculatorHandler