const verificarAdmin = (req, res, next) => {
  if (
    req.usuarioLogueado &&
    req.usuarioLogueado.rol &&
    req.usuarioLogueado.rol.nombre === "admin"
  ) {
    return next();
  }
  return res.status(403).json({ message: "Acceso no autorizado" });
};

module.exports = verificarAdmin;
