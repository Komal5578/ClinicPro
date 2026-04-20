const express = require('express');
const router = express.Router();
const { getInventory, getLowStock, addInventoryItem, updateStock } = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticate, authorizeRoles('doctor', 'receptionist', 'admin'), getInventory);
router.get('/low-stock', authenticate, authorizeRoles('doctor', 'receptionist', 'admin'), getLowStock);
router.post('/add', authenticate, authorizeRoles('receptionist', 'admin'), addInventoryItem);
router.patch('/:item_id/stock', authenticate, authorizeRoles('receptionist', 'admin'), updateStock);

module.exports = router;