const express = require("express");
const router = express.Router();
const {
  startMantenimiento,
  finishMantenimiento,
} = require("../controllers/mantenimientoController");

const verificarAdmin = require("../middlewares/verificarTrabajador");
const verificarToken = require("../middlewares/verificarToken");

// Ruta para poner en mantenimiento
router.post(
  "/startMantenimiento/:id",
  verificarToken,
  verificarAdmin,
  startMantenimiento
);

// Ruta para sacar del mantenimiento
router.post(
  "/finishMantenimiento/:id",
  verificarToken,
  verificarAdmin,
  finishMantenimiento
);

module.exports = router;
