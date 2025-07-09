const express = require('express');
const router = express.Router();
const {crearReserva, obtenerReservasPropias, obtenerTodasReservas, historialReservasUsuario, cancelarReserva, eliminarReserva, obtenerReservasPorFecha} = require('../controllers/reservaController');
const verificarToken = require('../middlewares/verificarToken');
const verificarTrabajador = require('../middlewares/verificarTrabajador');
const verificarAdmin = require('../middlewares/verificarAdmin');

router.post('/add', verificarToken, crearReserva);
router.get('/', verificarToken, obtenerReservasPropias);
router.get('/all', verificarToken, verificarTrabajador, obtenerTodasReservas);
router.get('/historial', verificarToken, verificarTrabajador, historialReservasUsuario); // Asumiendo que esta ruta es para el historial de reservas del usuario logueado
router.delete('/cancelar', verificarToken, cancelarReserva); // Asumiendo que la función cancelarReserva está exportada correctamente
router.post('/agregar', verificarToken, verificarTrabajador, crearReserva); // Ruta para crear reservas como empleado
router.delete('/eliminar', verificarToken, verificarTrabajador, eliminarReserva); // Asumiendo que la función eliminarReserva está exportada correctamente
router.get('/fecha', verificarToken, verificarTrabajador, obtenerReservasPorFecha); // Ruta para obtener reservas por fecha, asumiendo que la función está implementada en el controlador

module.exports = router;
