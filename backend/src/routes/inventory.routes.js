const express = require('express');
const router = express.Router();
const { getInventory, getLowStock, addInventoryItem, updateStock } = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// inventory.routes.js
router.get('/', authenticate, authorizeRoles('doctor', 'receptionist'), getInventory);
router.get('/low-stock', authenticate, authorizeRoles('doctor', 'receptionist'), getLowStock);
router.post('/add', authenticate, authorizeRoles('doctor', 'receptionist'), addInventoryItem);
router.patch('/:item_id/stock', authenticate, authorizeRoles('doctor', 'receptionist'), updateStock);

module.exports = router;