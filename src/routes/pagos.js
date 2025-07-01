const express = require('express');
const router = express.Router();
const { crearPago, pagarReserva } = require('../controllers/pagoController');
const verificarToken = require('../middlewares/verificarToken');

router.post('/checkout', verificarToken, crearPago);
router.post('/webhook', pagarReserva);



module.exports = router;
