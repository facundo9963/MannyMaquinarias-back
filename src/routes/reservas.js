const express = require("express");
const router = express.Router();
const { Reserva } = require("../models/reserva");

// Obtener todas las reservas
router.get("/", async (req, res) => {
  try {
    const reservas = await Reserva.findAll();
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
