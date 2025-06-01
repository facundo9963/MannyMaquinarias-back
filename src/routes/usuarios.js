const express = require("express");
const router = express.Router();
const {
  eliminarUsuario,
  eliminarUsuarioPorAdmin,
} = require("../controllers/usuarioController");
const verificarToken = require("../middlewares/verificarToken");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.delete(
  "/eliminar",
  verificarToken,
  eliminarUsuario,
  eliminarUsuarioPorAdmin
);

router.delete(
  "/eliminar/:id",
  verificarToken,
  verificarAdmin,
  eliminarUsuarioPorAdmin
);
module.exports = router;
