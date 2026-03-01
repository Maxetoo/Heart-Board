const BadRequestError = require('./BadRequest')
const NotFoundError = require('./NotFound')
const UnauthorizedError = require('./Unauthorised')
const ForbiddenError = require('./ForbiddenError')

const CustomError = {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError
}

module.exports = CustomError