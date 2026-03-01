const CustomError = require('./CustomError');
const { StatusCodes } = require('http-status-codes');

class ForbiddenError extends CustomError {
    constructor(message) {
        super(message)
        this.statuscode = StatusCodes.FORBIDDEN
    }
}

module.exports = ForbiddenError