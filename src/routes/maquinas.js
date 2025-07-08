const express = require("express");
const router = express.Router();
const maquinasController = require("../controllers/maquinaController");
const verificarAdmin = require("../middlewares/verificarAdmin");
const verificarTrabajador = require("../middlewares/verificarTrabajador");
const verificarToken = require("../middlewares/verificarToken");

// GET /maquinas
router.get("/", maquinasController.listarMaquinas);

router.get("/:numeroSerie", maquinasController.obtenerMaquinaPorSerie);

router.post("/add", verificarToken, verificarAdmin, maquinasController.agregarMaquina);

router.delete("/delete/:id", verificarToken, verificarAdmin, maquinasController.eliminarMaquina);

router.put("/update/:id", verificarToken, verificarAdmin, maquinasController.modificarMaquina);

router.post("/recibir", verificarToken, verificarTrabajador, maquinasController.recibirMaquina);

router.post("/entregar", verificarToken, verificarTrabajador, maquinasController.entregarMaquina);

module.exports = router;
