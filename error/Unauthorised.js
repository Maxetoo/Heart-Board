const CustomError = require('./CustomError')
const { StatusCodes } = require('http-status-codes');



class UnauthorizedError extends CustomError {
    constructor(message) {
        super(message)
        this.statuscode = StatusCodes.UNAUTHORIZED
    }
}

module.exports = UnauthorizedError