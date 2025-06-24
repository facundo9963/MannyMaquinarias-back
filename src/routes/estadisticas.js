const express = require("express");
const router = express.Router();
const estadisticasController = require("../controllers/estadisticasController");
const verificarAdmin = require("../middlewares/verificarAdmin");
const verificarToken = require("../middlewares/verificarToken");

// GET /estadisticas
router.get("/users", verificarToken, verificarAdmin, estadisticasController.obtenerEstadisticasUsuarios);

router.get("/montos", verificarToken, verificarAdmin, estadisticasController.obtenerEstadisticasMontos);

module.exports = router;