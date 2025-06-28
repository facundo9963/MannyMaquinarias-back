const express = require("express");
const router = express.Router(); // ¡Esta línea es crucial!

// Importa los otros routers
const maquinasRouter = require("./maquinas");
const usuariosRouter = require("./usuarios");
const authRouter = require("./auth");
const listaNegra = require("./listaNegra");
const reservasRouter = require("./reservas");
const politicasCancelacionRouter = require("./politicasCancelacion");
const pagosRoutes = require("./pagos");
const sucursalesRouter = require("./sucursales");
const mantenimientosRouter = require("./mantenimientos");

// Ruta de inicio
router.get("/", (req, res) => {
  res.json({
    message: "API de MannyMaquinarias",
    endpoints: {
      maquinas: "/maquinas",
      auth: "/auth",
      usuarios: "/usuarios",
      listaNegra: "/listaNegra",
      reservas: "/reservas",
      politicasCancelacion: "/politicasCancelacion",
      sucursales: "/sucursales",
      mantenimientos: "/mantenimientos",
    },
  });
});

// Monta los otros routers
router.use("/maquinas", maquinasRouter);
router.use("/auth", authRouter);
router.use("/usuarios", usuariosRouter);
router.use("/listaNegra", listaNegra);
router.use("/reservas", reservasRouter);
router.use("/politicasCancelacion", politicasCancelacionRouter);
router.use("/pagos", pagosRoutes);
router.use("/sucursales", sucursalesRouter);
router.use("/mantenimientos", mantenimientosRouter);
module.exports = router;
