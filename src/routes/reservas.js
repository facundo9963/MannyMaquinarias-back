const express = require('express');
const router = express.Router();
const {crearReserva, obtenerReservasPropias} = require('../controllers/reservaController');

router.post('/add', crearReserva);
router.get('/usuario/:usuarioId', obtenerReservasPropias);

module.exports = router;
