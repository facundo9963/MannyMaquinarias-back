const express = require("express");
const router = express.Router();
const maquinasController = require("../controllers/maquinaController");
const validarMaquina = require('../middlewares/validarMaquina');

// GET /maquinas
router.get("/", maquinasController.listarMaquinas);

router.post('/', validarMaquina, maquinasController.agregarMaquina);

router.delete('/:id', maquinasController.eliminarMaquina);

module.exports = router;
