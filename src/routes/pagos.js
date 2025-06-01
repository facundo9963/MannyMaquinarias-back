const express = require('express');
const router = express.Router();
const { crearPago, verifyPayment } = require('../controllers/pagoController');

router.post('/checkout', crearPago);

router.get('/success', verifyPayment);
router.get('/failure', verifyPayment);
router.get('/pending', verifyPayment);


module.exports = router;
