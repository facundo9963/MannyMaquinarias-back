const { Usuario, Rol } = require("../../db");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  const { dni, nombreUsuario, nombre, apellido, password, direccion, edad } =
    req.body;

  try {
    // Verificaciones de unicidad
    const [dniExistente, usuarioExistente] = await Promise.all([
      Usuario.findOne({ where: { dni } }),
      Usuario.findOne({ where: { nombreUsuario } }),
    ]);

    if (dniExistente) {
      return res.status(400).json({ error: "El DNI ya está registrado." });
    }

    if (usuarioExistente) {
      return res
        .status(400)
        .json({ error: "El nombre de usuario ya está en uso." });
    }

    // Obtener el rol cliente
    const rolCliente = await Rol.findOne({ where: { nombre: "cliente" } });

    if (!rolCliente) {
      return res.status(500).json({ error: "No se encontró el rol cliente." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      dni,
      nombreUsuario,
      nombre,
      apellido,
      password: hashedPassword,
      direccion,
      edad,
      rol_id: rolCliente.id,
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente.",
      usuario: {
        id: nuevoUsuario.id,
        nombreUsuario: nuevoUsuario.nombreUsuario,
      },
    });
  } catch (err) {
    console.error("Error en registerUser:", err);
    console.error(err.stack);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = { registerUser };
