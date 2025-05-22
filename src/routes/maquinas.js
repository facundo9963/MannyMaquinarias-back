const express = require("express");
const router = express.Router();
const { listarMaquinas } = require("../controllers/maquinaController");

// GET /maquinas
router.get("/", listarMaquinas);

module.exports = router;
