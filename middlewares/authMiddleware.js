const { StatusCodes } = require('http-status-codes')
const { signJwt } = require('../helpers/jwtHelper')
const CustomError = require('../error')

const authentication = (req, res, next) => {
    const authToken = req.signedCookies.token
    if (!authToken) {
        throw new CustomError.UnauthorizedError('Not authenticated')
    }
    const user = signJwt(authToken)
    req.user = user
    next()
}


const adminAuthorization = (req, res, next) => {
    const { role } = req.user
    if (role !== 'admin' && role !== 'super_admin') {
        throw new CustomError.UnauthorizedError('Not authorized')
    }
    next()
}

const superAdminAuthorization = (req, res, next) => {
    const { role } = req.user
    if (role !== 'super_admin') {
        throw new CustomError.UnauthorizedError('Not authorized')
    }
    next()
}

const checkUser = (req, res, next) => {
    const authToken = req.signedCookies.token || ''
    if (authToken) {
        const user = signJwt(authToken)
        req.user = user
    }
    next()
}


module.exports = {
    authentication,
    adminAuthorization,
    superAdminAuthorization,
    checkUser
}