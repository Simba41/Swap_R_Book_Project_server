const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

const r = express.Router();

r.get('/',               authRequired, ctrl.list);
r.put('/read-all',       authRequired, ctrl.markAllRead);   
r.put('/:id/read',       authRequired, ctrl.markRead);

module.exports = r;
