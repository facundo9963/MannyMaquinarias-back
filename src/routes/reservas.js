const express = require('express');
const router = express.Router();
const {crearReserva, obtenerReservasPropias, obtenerTodasReservas} = require('../controllers/reservaController');
const verificarToken = require('../middlewares/verificarToken');

router.post('/add', verificarToken, crearReserva);
router.get('/', verificarToken, obtenerReservasPropias);
router.get('/all', verificarToken, obtenerTodasReservas);

module.exports = router;
