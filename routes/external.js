const express = require('express');
const ctrl = require('../controllers/externalController');

const r = express.Router();
r.get('/books', ctrl.searchBooks);
module.exports = r;
