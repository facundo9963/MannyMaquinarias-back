const express = require("express");
const router = express.Router();
const {
  eliminarUsuario,
  eliminarUsuarioPorAdmin,
  listarInformacionUsuario,
  modificarUsuario,
  verUsuarios,
} = require("../controllers/usuarioController");
const verificarToken = require("../middlewares/verificarToken");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.delete("/eliminar", verificarToken, eliminarUsuario);

router.delete(
  "/eliminar/:email",
  verificarToken,
  verificarAdmin,
  eliminarUsuarioPorAdmin
);

router.get("/rol", verificarToken, verificarAdmin, verUsuarios);

router.get("/", verificarToken, listarInformacionUsuario);

router.put("/update", verificarToken, modificarUsuario);

module.exports = router;
