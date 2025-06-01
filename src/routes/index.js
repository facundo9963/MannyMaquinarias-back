const express = require("express");
const router = express.Router(); // ¡Esta línea es crucial!

// Importa los otros routers
const maquinasRouter = require("./maquinas");
const usuariosRouter = require("./usuarios");
const authRouter = require("./auth");
const listaNegra = require("./listaNegra");

const pagosRoutes = require("./pagos");

// Ruta de inicio
router.get("/", (req, res) => {
  res.json({
    message: "API de MannyMaquinarias",
    endpoints: {
      maquinas: "/maquinas",
      auth: "/auth",
      usuarios: "/usuarios",
      listaNegra: "/listaNegra",
    },
  });
});

// Monta los otros routers
router.use("/maquinas", maquinasRouter);
router.use("/auth", authRouter);
router.use("/usuarios", usuariosRouter);
router.use("/listaNegra", listaNegra);

router.use("/pagos", pagosRoutes);

module.exports = router;
