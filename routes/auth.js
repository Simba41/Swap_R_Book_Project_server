const express = require('express');
const ctrl = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

const r = express.Router();

r.post('/register', ctrl.register);
r.post('/login',    ctrl.login);

r.get('/me',        authRequired, ctrl.me);

module.exports = r;
