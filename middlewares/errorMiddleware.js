const { StatusCodes } = require('http-status-codes');

/**
 * Errors we raise DELIBERATELY carry a statuscode (see error/CustomError.js and
 * its subclasses). Their messages are written for the person reading them —
 * "This board is private", "Username is already taken" — so they are safe and
 * useful to pass straight through.
 *
 * Anything without one arrived by accident: a driver fault, a null dereference,
 * a bug. Those messages are written for us, not for a user, and often carry
 * internals — the failure that prompted this was
 * "getaddrinfo ENOTFOUND ac-fcnrs8d-shard-00-00.fvd4xyu.mongodb.net" rendered
 * in the feed, which told the user nothing and told everyone else our database
 * cluster's hostname.
 */
const isIntentional = (err) => typeof err.statuscode === 'number';

/** Mongo/Mongoose driver faults all share this prefix (MongoNetworkError, …). */
const isDatabaseError = (err) =>
  /^Mongo/i.test(err.name || '') || /^Mongoose/i.test(err.name || '');

const GENERIC_MESSAGE = 'Something went wrong on our end. Please try again.';
const UNAVAILABLE_MESSAGE =
  'We are having trouble reaching our servers right now. Please try again in a moment.';

const errorHandlerMiddleware = (err, req, res, next) => {
    // Mongoose validation and constraint failures are about what the caller
    // SENT, so they stay specific — that is the whole point of the message.
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((item) => item.message).join(', ');
        return res.status(StatusCodes.BAD_REQUEST).json({ message });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {}).join(', ') || 'that';
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: `Duplicate value entered for ${field} field, please choose another value`,
        });
    }

    if (err.name === 'CastError') {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `Id : ${err.value} not found` });
    }

    if (isIntentional(err)) {
        return res.status(err.statuscode).json({ message: err.message });
    }

    // Unexpected. The full error goes to the server log, where it is actually
    // useful; the caller gets a sentence they can act on.
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);

    if (isDatabaseError(err)) {
        return res
            .status(StatusCodes.SERVICE_UNAVAILABLE)
            .json({ message: UNAVAILABLE_MESSAGE });
    }

    return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: GENERIC_MESSAGE });
};


module.exports = errorHandlerMiddleware;
