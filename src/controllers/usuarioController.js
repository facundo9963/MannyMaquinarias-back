const { Usuario, Rol } = require("../../db");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
  const usuarioLogueado = req.usuarioLogueado; // inyectado por middleware de autenticación
  const {
    dni,
    nombreUsuario,
    nombre,
    apellido,
    password,
    email,
    direccion,
    edad,
    rol, // opcional para trabajador
  } = req.body;

  try {
    // Validaciones básicas
    const [dniExistente, usuarioExistente, emailExistente] = await Promise.all([
      Usuario.findOne({ where: { dni } }),
      Usuario.findOne({ where: { nombreUsuario } }),
      Usuario.findOne({ where: { email } }),
    ]);

    if (dniExistente) {
      return res.status(400).json({ error: "El DNI ya está registrado." });
    }

    if (usuarioExistente) {
      return res
        .status(400)
        .json({ error: "El nombre de usuario ya está en uso." });
    }

    if (emailExistente) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // Verificar rol solicitante
    if (
      !usuarioLogueado ||
      !usuarioLogueado.rol ||
      !usuarioLogueado.rol.nombre
    ) {
      return res.status(403).json({ error: "No autorizado." });
    }

    const rolSolicitado = rol || "cliente";

    const rolDB = await Rol.findOne({ where: { nombre: rolSolicitado } });

    if (!rolDB) {
      return res.status(400).json({ error: "El rol solicitado no existe." });
    }

    const rolCreador = usuarioLogueado.rol.nombre;

    if (rolCreador === "trabajador" && rolSolicitado !== "cliente") {
      return res
        .status(403)
        .json({ error: "Los trabajadores solo pueden crear clientes." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      dni,
      nombreUsuario,
      nombre,
      apellido,
      password: hashedPassword,
      email, // Nuevo campo añadido
      direccion,
      edad,
      rol_id: rolDB.id,
    });

    return res.status(201).json({
      message: "Usuario creado correctamente.",
      usuario: {
        id: nuevoUsuario.id,
        nombreUsuario: nuevoUsuario.nombreUsuario,
        email: nuevoUsuario.email, // Incluimos el email en la respuesta
        rol: rolDB.nombre,
      },
    });
  } catch (err) {
    console.error("Error en createUser:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = { createUser };
