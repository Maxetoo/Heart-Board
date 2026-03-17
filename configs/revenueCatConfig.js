const axios = require('axios');
const RC_BASE = 'https://api.revenuecat.com/v1';

const rcClient = axios.create({
  baseURL: RC_BASE,
  headers: {
    Authorization:  `Bearer ${process.env.REVENUECAT_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Platform':   'web',
  },
});


async function getSubscriberInfo(appUserId) {
  const res = await rcClient.get(`/subscribers/${encodeURIComponent(appUserId)}`);
  return res.data.subscriber;
}


async function getActiveEntitlements(appUserId) {
  const subscriber = await getSubscriberInfo(appUserId);
  return Object.keys(subscriber.entitlements ?? {}).filter(
    key => subscriber.entitlements[key].expires_date === null ||
           new Date(subscriber.entitlements[key].expires_date) > new Date()
  );
}

function verifyWebhookSecret(headerValue) {
  return headerValue === process.env.REVENUECAT_WEBHOOK_SECRET;
}

// Product / entitlement identifiers — must match your RC dashboard exactly
const RC_PRODUCTS = {
  PRO_MONTHLY:         'pro_monthly',
  PRO_ANNUAL:          'pro_annual',
  BOARD_STANDARD:      'board_upgrade_standard',
  BOARD_PREMIUM:       'board_upgrade_premium',
  SPONSOR_200:         'sponsor_200',
  SPONSOR_1000:        'sponsor_1000',
  SPONSOR_UNLIMITED:   'sponsor_unlimited',
};

const RC_ENTITLEMENTS = {
  PRO:             'pro',
  BOARD_STANDARD:  'board_upgrade_standard',
  BOARD_PREMIUM:   'board_upgrade_premium',
};

// Tier upgrade prices in USD cents (kept here for display; actual charge via RC)
const TIER_UPGRADE_PRICES = {
  'basic→standard': 499,
  'standard→premium': 999,
  'basic→premium': 1399,
};

const TIER_ORDER = { basic: 0, standard: 1, premium: 2 };

module.exports = {
  rcClient,
  getSubscriberInfo,
  getActiveEntitlements,
  verifyWebhookSecret,
  RC_PRODUCTS,
  RC_ENTITLEMENTS,
  TIER_UPGRADE_PRICES,
  TIER_ORDER,
};