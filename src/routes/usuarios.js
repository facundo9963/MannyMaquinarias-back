const express = require("express");
const router = express.Router();
const {
  eliminarUsuario,
  eliminarUsuarioPorAdmin,
  listarInformacionUsuario,
  modificarUsuario,
  verUsuarios,
  createUser,
  obtenerMonto,
} = require("../controllers/usuarioController");
const verificarToken = require("../middlewares/verificarToken");
const verificarAdmin = require("../middlewares/verificarAdmin");
const verificarTrabajador = require("../middlewares/verificarTrabajador");

router.delete("/eliminar", verificarToken, eliminarUsuario);

router.post("/crear", verificarToken, verificarTrabajador, createUser);

router.delete(
  "/eliminar/:email",
  verificarToken,
  verificarAdmin,
  eliminarUsuarioPorAdmin
);

router.get("/rol", verificarToken, verificarAdmin, verUsuarios);

router.get("/", verificarToken, listarInformacionUsuario);

router.put("/update", verificarToken, modificarUsuario);

router.get(
  "/monto",
  verificarToken,
  obtenerMonto
);

module.exports = router;
