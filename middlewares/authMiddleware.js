const { StatusCodes } = require('http-status-codes')
const { signJwt } = require('../helpers/jwtHelper')
const CustomError = require('../error')

const authentication = (req, res, next) => {
    const authToken = req.signedCookies.token
    if (!authToken) {
        throw new CustomError.UnauthorizedError('Not authenticated')
    }
    // An expired or tampered token makes jwt.verify throw a JsonWebTokenError,
    // which the error middleware does not recognise, so a session that had
    // simply run out answered 500 "Something went wrong" instead of 401 — and
    // the client never got the signal to treat the visitor as signed out.
    let user
    try {
        user = signJwt(authToken)
    } catch (err) {
        throw new CustomError.UnauthorizedError('Not authenticated')
    }
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
        // Optional auth: a bad token means "no viewer", never a failed request.
        // This used to throw, so anyone still holding an expired cookie — signed
        // out as far as they know — got a 500 on every public read that passes
        // through here: the discover feed, a board, its messages.
        try {
            req.user = signJwt(authToken)
        } catch (err) {
            req.user = undefined
        }
    }
    next()
}


module.exports = {
    authentication,
    adminAuthorization,
    superAdminAuthorization,
    checkUser
}