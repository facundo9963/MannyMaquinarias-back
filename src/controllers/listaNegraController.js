const { ListaNegra, Usuario } = require("../../db");

const agregarUsuarioAListaNegra = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const yaBloqueado = await ListaNegra.findOne({
      where: { usuario_id: usuarioId },
    });
    if (yaBloqueado) {
      return res
        .status(400)
        .json({ error: "El usuario ya está en la lista negra" });
    }

    await ListaNegra.create({ usuario_id: usuarioId });

    return res
      .status(201)
      .json({ message: "Usuario agregado a la lista negra exitosamente" });
  } catch (error) {
    console.error("Error al agregar a lista negra:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerUsuariosListaNegra = async (req, res) => {
  try {
    const usuariosEnLista = await ListaNegra.findAll({
      include: {
        model: Usuario,
        as: "usuario",
        attributes: [
          "id",
          "nombre",
          "apellido",
          "email",
          "nombreUsuario",
          "dni",
        ],
        required: true,
      },
    });

    const usuarios = usuariosEnLista.map((entry) => entry.usuario);

    return res.json({ usuarios });
  } catch (error) {
    console.error("Error al obtener la lista negra:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  agregarUsuarioAListaNegra,
  obtenerUsuariosListaNegra,
};
