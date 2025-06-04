const express = require("express");
const router = express.Router();
const { getSucursales } = require("../controllers/sucursalesController");

// Ruta GET para obtener todas las sucursales
router.get("/", getSucursales);

module.exports = router;
