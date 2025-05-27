const express = require("express");
const router = express.Router();
const { eliminarUsuario } = require("../controllers/usuarioController");
const verificarToken = require("../middlewares/verificarToken");

router.delete("/eliminar", verificarToken, eliminarUsuario);

module.exports = router;
