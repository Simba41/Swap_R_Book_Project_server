const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

const r = express.Router();
r.use(authRequired);

r.get('/', ctrl.list);

r.put('/read-all', ctrl.markAllRead);
r.put('/:id/read', ctrl.markRead);

module.exports = r;
