const express = require('express');
const UploadRouter = express.Router();
const { uploadFile } = require('../controllers/uploadController');
const { authentication } = require('../middlewares/authMiddleware');


UploadRouter.post('/', authentication, uploadFile);


module.exports = UploadRouter; 