const express = require('express');
const router = express.Router();
const {crearReserva, obtenerReservasPropias} = require('../controllers/reservaController');
const verificarToken = require('../middlewares/verificarToken');

router.post('/add', verificarToken, crearReserva);
router.get('/', verificarToken, obtenerReservasPropias);

module.exports = router;
