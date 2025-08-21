const express = require('express');
const ctrl = require('../controllers/statsController');

const r = express.Router();
r.get('/books-by-category', ctrl.booksByCategory);

module.exports = r;
