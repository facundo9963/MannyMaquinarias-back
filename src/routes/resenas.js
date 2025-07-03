const express = require('express');
const router = express.Router();
const {crearResena, 
obtenerResenasPorMaquina,
obtenerResenasPorUsuario,
obtenerTodasResenasPorUsuario } = require('../controllers/resenasController');
const verificarToken = require('../middlewares/verificarToken');
const verificarTrabajador = require('../middlewares/verificarTrabajador');
const verificarAdmin = require('../middlewares/verificarAdmin');


router.get('/', verificarToken, obtenerResenasPorUsuario);
router.post('/add', verificarToken, crearResena);
router.get('/maquina', verificarToken, obtenerResenasPorMaquina);
router.get('/usuario', verificarToken, verificarAdmin, obtenerTodasResenasPorUsuario);

module.exports = router;