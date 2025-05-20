const express = require("express");
const router = express.Router(); // ¡Esta línea es crucial!

// Importa los otros routers
const maquinasRouter = require("./maquinas");
const reservasRouter = require("./reservas");
// Ruta de inicio
router.get("/", (req, res) => {
  res.json({
    message: "API de MannyMaquinarias",
    endpoints: {
      maquinas: "/maquinas",
      reservas: "/reservas",
    },
  });
});

// Monta los otros routers
router.use("/maquinas", maquinasRouter);
router.use("/reservas", reservasRouter);

module.exports = router;
