const express = require("express");
const router = express.Router();
const {
  getPoliticasCancelacion,
} = require("../controllers/politicaCancelacionController");

router.get("/", getPoliticasCancelacion);

module.exports = router;
