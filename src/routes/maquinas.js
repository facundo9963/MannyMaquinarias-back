const express = require("express");
const router = express.Router();
const maquinasController = require("../controllers/maquinaController");

// GET /maquinas
router.get("/", maquinasController.listarMaquinas);

router.post('/add', maquinasController.agregarMaquina);

router.delete('/delete/:id', maquinasController.eliminarMaquina);

router.put('/update/:id', maquinasController.modificarMaquina);

module.exports = router;
