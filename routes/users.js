const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

const r = express.Router();

r.put('/me', authRequired, ctrl.updateMe);
r.put('/me/password', authRequired, ctrl.changePassword);
r.get('/:id', ctrl.getById);

module.exports = r;
