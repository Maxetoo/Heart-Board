const express = require('express');
const SearchRoute = express.Router();
const { search, globalStats } = require('../controllers/searchController');
const { checkUser } = require('../middlewares/authMiddleware');

// Public search — works signed out, so visitors can find people and boards.
SearchRoute.get('/', checkUser, search);

module.exports = SearchRoute;
module.exports.globalStats = globalStats;
