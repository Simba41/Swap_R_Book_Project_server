const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/messageController');

const r = express.Router();
r.use(authRequired);

r.get('/conversations', ctrl.listConversations);
r.get('/', ctrl.listThread);
r.post('/send', ctrl.send);
r.put('/read', ctrl.markRead);

module.exports = r;
