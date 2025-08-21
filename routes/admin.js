const express = require('express');
const { authRequired, adminRequired } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

const r = express.Router();
r.use(authRequired, adminRequired);

r.get('/metrics', ctrl.metrics);
r.get('/users', ctrl.listUsers);
r.put('/users/:id/ban', ctrl.banUser);
r.put('/users/:id/unban', ctrl.unbanUser);
r.get('/books', ctrl.listBooks);
r.get('/reports', ctrl.listReports);
r.put('/reports/:id/resolve', ctrl.resolveReport);
r.get('/changes', ctrl.listChanges);
r.get('/conversations', ctrl.listConversations);
r.get('/messages', ctrl.listMessages);

module.exports = r;
