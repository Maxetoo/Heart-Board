const sendEmail = require('./emailConstruct');
const resetPasswordEmail = require('./resetPasswordEmail');
const resendVerificationEmail = require('./resendVerificationEmail');

/**
 * Every email the queue is allowed to send, by the name a job asks for.
 *
 * To add one: write the template beside this file (build the HTML, call
 * sendEmail, export the function), then add it here. That is the whole
 * registration — the worker reads this map, so nothing else needs touching.
 *
 *   await emailSendingQueue.add('send-x-email', {
 *     funcName: 'myNewEmail',
 *     args: [{ email, ...whatever the template destructures }],
 *   });
 */
const templates = {
  resetPasswordEmail,
  resendVerificationEmail,
};

module.exports = {
  /** The Resend sender itself, for one-off mail outside the queue. */
  sendEmail,
  templates,
  resetPasswordEmail,
  resendVerificationEmail,
};
