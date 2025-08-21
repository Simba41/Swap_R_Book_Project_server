const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/swapController');

const r = express.Router();
r.use(authRequired);

r.get('/', ctrl.get);
r.post('/toggle', ctrl.toggle);

module.exports = r;
