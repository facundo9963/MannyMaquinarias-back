const express = require("express");
const router = express.Router();
const { Maquina } = require("../models/maquina");

// Obtener todas las máquinas
router.get("/", async (req, res) => {
  try {
    const maquinas = await Maquina.findAll();
    res.json(maquinas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
