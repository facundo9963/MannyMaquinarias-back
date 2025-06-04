const express = require("express");
const router = express.Router();
const maquinasController = require("../controllers/maquinaController");
const verificarAdmin = require("../middlewares/verificarAdmin");
const verificarToken = require("../middlewares/verificarToken");

// GET /maquinas
router.get("/", maquinasController.listarMaquinas);

router.get("/:numeroSerie", maquinasController.obtenerMaquinaPorSerie);

router.post("/add", verificarToken, verificarAdmin, maquinasController.agregarMaquina);

router.delete("/delete/:id", verificarToken, verificarAdmin, maquinasController.eliminarMaquina);

router.put("/update/:id", verificarToken, verificarAdmin, maquinasController.modificarMaquina);

module.exports = router;
