const express = require('express');
const router = express.Router();
const {crearReserva, obtenerReservasPropias, obtenerTodasReservas, historialReservasUsuario} = require('../controllers/reservaController');
const verificarToken = require('../middlewares/verificarToken');

router.post('/add', verificarToken, crearReserva);
router.get('/', verificarToken, obtenerReservasPropias);
router.get('/all', verificarToken, obtenerTodasReservas);
router.get('/historial', verificarToken, historialReservasUsuario); // Asumiendo que esta ruta es para el historial de reservas del usuario logueado

module.exports = router;
