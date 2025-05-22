const jwt = require("jsonwebtoken");
const { Usuario, Rol } = require("../models");

const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id, {
      include: {
        model: Rol,
        as: "rol",
      },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Usuario no encontrado." });
    }

    req.usuarioLogueado = usuario;
    next();
  } catch (error) {
    console.error("Error en verificarToken:", error);
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

module.exports = verificarToken;
