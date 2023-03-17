const axios = require("axios");
const crypto = require('crypto');
const credentials = require("../config/cred.config");

const baseUrls = {
    dcx: "https://api.coindcx.com",
}

const dcxAPI = axios.create({
    baseURL: baseUrls.dcx,
});

const dcxAuthApi = (method, path, body) => {
    const payload = Buffer.from(JSON.stringify(body)).toString();
    const signature = crypto.createHmac('sha256', credentials?.['dcx-secret']).update(payload).digest('hex')
    return dcxAPI.request({
        method: method,
        url: path,
        headers: {
            'X-AUTH-APIKEY': credentials?.['dcx-key'],
            'X-AUTH-SIGNATURE': signature,
        },
        data: body,
    })
}

const dcxPublicApi = (method, path, body) => {
    return dcxAPI.request({
        method: method,
        url: path,
        data: body,
    })
}

module.exports = {
    dcxAuthApi,
    dcxPublicApi,
}


