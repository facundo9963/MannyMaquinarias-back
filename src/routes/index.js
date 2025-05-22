const express = require("express");
const router = express.Router(); // ¡Esta línea es crucial!

// Importa los otros routers
const maquinasRouter = require("./maquinas");
const reservasRouter = require("./reservas");
const authRouter = require("./auth");
// Ruta de inicio
router.get("/", (req, res) => {
  res.json({
    message: "API de MannyMaquinarias",
    endpoints: {
      maquinas: "/maquinas",
      reservas: "/reservas",
      usuarios: "/auth",
    },
  });
});
app.use('/maquinas', maquinasRouter);

// Monta los otros routers
router.use("/maquinas", maquinasRouter);
router.use("/reservas", reservasRouter);
router.use("/auth", authRouter);

module.exports = router;
