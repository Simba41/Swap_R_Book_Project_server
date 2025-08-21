const express = require('express');
const { authRequired, adminRequired } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

const r = express.Router();

r.post('/', authRequired, ctrl.create);

r.get('/', authRequired, adminRequired, ctrl.list);
r.put('/:id/status', authRequired, adminRequired, ctrl.updateStatus);

module.exports = r;
