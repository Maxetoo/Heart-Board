const { resend, FROM, REPLY_TO, isConfigured } = require('../configs/resendConfig');

/**
 * Formats a recipient as Resend wants it: either "Name <address>" or a bare
 * address. A generic placeholder name ("User") is dropped rather than shown,
 * since mail clients render it as the recipient's name.
 */
const addressee = (email, name) => {
  const clean = (name || '').trim();
  if (!clean || clean.toLowerCase() === 'user') return email;
  // A display name containing a comma or angle bracket would break the header.
  return `${clean.replace(/[<>,"]/g, '')} <${email}>`;
};

/**
 * Sends one transactional email through Resend.
 *
 * The signature is positional to match what the templates in this folder
 * already pass; everything optional lives in `options`.
 *
 *   sendEmail('a@b.com', 'Maxwell', 'Welcome', '<p>hi</p>')
 *   sendEmail(to, name, subject, html, { scheduledAt: 'in 1 min' })
 *
 * @param {string|string[]} to        Recipient address, or several.
 * @param {string}          name      Display name for a single recipient.
 * @param {string}          subject
 * @param {string}          html      Full HTML body.
 * @param {object}          [options]
 * @param {string}          [options.text]        Plain-text alternative.
 * @param {string}          [options.replyTo]     Overrides the default.
 * @param {string|string[]} [options.cc]
 * @param {string|string[]} [options.bcc]
 * @param {string}          [options.from]        Must be on a verified domain.
 * @param {string}          [options.scheduledAt] ISO 8601, or natural language
 *                                                such as 'in 1 min'.
 * @param {Array}           [options.attachments] Resend attachment objects.
 * @param {object}          [options.headers]
 * @param {string[]}        [options.tags]
 * @returns {Promise<{ id: string }>} The sent message, by Resend's id.
 *
 * THROWS on failure, deliberately. The ZeptoMail version this replaces ended in
 * `.catch(error => console.log("error"))`, which swallowed the reason and still
 * resolved — so a bounced or rejected email looked like a success, and the
 * BullMQ job that sent it was marked complete and never retried.
 */
const sendEmail = async (to, name, subject, html, options = {}) => {
  if (!isConfigured) {
    throw new Error('RESEND_API_KEY is not set — cannot send email.');
  }
  if (!to) throw new Error('sendEmail: a recipient is required.');
  if (!subject) throw new Error('sendEmail: a subject is required.');
  if (!html) throw new Error('sendEmail: an HTML body is required.');

  const recipients = Array.isArray(to) ? to : [addressee(to, name)];

  const payload = {
    from: options.from || FROM,
    to: recipients,
    subject,
    html,
    replyTo: options.replyTo || REPLY_TO,
  };

  // Only send the keys that were actually asked for: Resend validates the
  // shape of each one, and an explicit undefined is not the same as absent.
  if (options.text) payload.text = options.text;
  if (options.cc) payload.cc = options.cc;
  if (options.bcc) payload.bcc = options.bcc;
  if (options.scheduledAt) payload.scheduledAt = options.scheduledAt;
  if (options.attachments) payload.attachments = options.attachments;
  if (options.headers) payload.headers = options.headers;
  if (options.tags) payload.tags = options.tags;

  // Resend RETURNS its errors rather than throwing them, so an unchecked call
  // silently does nothing on a bad key or an unverified domain.
  const { data, error } = await resend.emails.send(payload);

  if (error) {
    const err = new Error(`Resend refused "${subject}": ${error.message || error.name}`);
    err.name = error.name || 'ResendError';
    err.cause = error;
    throw err;
  }

  console.log(`[email] sent "${subject}" -> ${recipients.join(', ')} (${data?.id})`);
  return data;
};

module.exports = sendEmail;
