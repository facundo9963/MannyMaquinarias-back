const express = require("express");
const router = express.Router();
const { addUser } = require("../controllers/usuariosController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/usuarios", authMiddleware, addUser);

module.exports = router;
