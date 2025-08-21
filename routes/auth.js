const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const r = express.Router();
r.post('/register', ctrl.register);
r.post('/login', ctrl.login);
r.get('/me', authRequired, ctrl.me);

module.exports = r;
