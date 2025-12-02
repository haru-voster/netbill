const axios = require('axios');
const qs = require('querystring');

const getBaseUrls = (useSandbox) => {
  if (useSandbox === 'true' || useSandbox === true) {
    return {
      oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      stk: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    };
  }
  return {
    oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stk: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  };
};

module.exports = {
  getToken: async (key, secret, useSandbox) => {
    const urls = getBaseUrls(useSandbox);
    const resp = await axios.get(urls.oauth, {
      auth: { username: key, password: secret }
    });
    return resp.data.access_token;
  },

  stkPush: async ({phone, amount, shortcode, passkey, key, secret, callback, useSandbox}) => {
    const urls = getBaseUrls(useSandbox);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const token = await module.exports.getToken(key, secret, useSandbox);

    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callback,
      AccountReference: "WIFI",
      TransactionDesc: "WiFi Billing Payment"
    };

    const resp = await axios.post(urls.stk, body, {
      headers: { Authorization: 'Bearer ' + token }
    });
    return resp.data;
  }
};
