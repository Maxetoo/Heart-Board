const { Resend } = require('resend');

/**
 * Resend, the transactional email provider. Replaces ZeptoMail (Zoho).
 *
 * The client is constructed eagerly but the key is NOT required at boot: the
 * API and the worker must still start on a machine with no mail credentials
 * (a local checkout, CI), and every send goes through emailConstruct.js, which
 * fails loudly with a clear message if the key turns out to be missing.
 */
const apiKey = process.env.RESEND_API_KEY;

const resend = new Resend(apiKey);

/**
 * The verified sending identity.
 *
 * The domain (heartboardapp.com) must be verified in the Resend dashboard, and
 * the address here must sit on it — Resend rejects anything else. Overridable
 * so staging can send from its own subdomain without a code change.
 */
const FROM = process.env.EMAIL_FROM || 'Heart Board <info@heartboardapp.com>';

/** Where replies go. Falls back to the address the templates already advertise. */
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'heartboardapp@gmail.com';

/** False when no key is configured, so callers can say why rather than 401. */
const isConfigured = Boolean(apiKey);

module.exports = { resend, FROM, REPLY_TO, isConfigured };
