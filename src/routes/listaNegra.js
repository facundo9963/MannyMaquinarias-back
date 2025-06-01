const express = require("express");
const router = express.Router();
const {
  agregarUsuarioAListaNegra,
  obtenerUsuariosListaNegra,
} = require("../controllers/listaNegraController");

const verificarAdmin = require("../middlewares/verificarAdmin");
const verificarToken = require("../middlewares/verificarToken");
router.post(
  "/:email",
  verificarToken,
  verificarAdmin,
  agregarUsuarioAListaNegra
);

router.get("/", verificarToken, verificarAdmin, obtenerUsuariosListaNegra);

module.exports = router;
