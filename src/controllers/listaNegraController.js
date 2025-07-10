const { ListaNegra, Usuario } = require("../../db");

const agregarUsuarioAListaNegra = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "Se requiere un email." });
  }

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Verificar si ya está en lista negra
    const existente = await ListaNegra.findOne({
      where: { usuario_id: usuario.id },
    });

    if (existente) {
      return res
        .status(400)
        .json({ error: "El usuario ya está en la lista negra." });
    }

    await ListaNegra.create({ usuario_id: usuario.id });

    return res
      .status(201)
      .json({ message: "Usuario agregado a la lista negra." });
  } catch (error) {
    console.error("Error al agregar a la lista negra:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
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

const eliminarUsuarioDeListaNegra = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "Se requiere un email." });
  }

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const entradaListaNegra = await ListaNegra.findOne({
      where: { usuario_id: usuario.id },
    });

    if (!entradaListaNegra) {
      return res
        .status(400)
        .json({ error: "El usuario no está en la lista negra." });
    }

    await entradaListaNegra.destroy();

    return res.json({ message: "Usuario eliminado de la lista negra." });
  } catch (error) {
    console.error("Error al eliminar de la lista negra:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = {
  agregarUsuarioAListaNegra,
  obtenerUsuariosListaNegra,
  eliminarUsuarioDeListaNegra,
};
