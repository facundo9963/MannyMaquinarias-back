const { Usuario, Rol } = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const {
    dni,
    nombreUsuario,
    nombre,
    apellido,
    password,
    email,
    direccion,
    edad,
  } = req.body;

  try {
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
      email,
      direccion,
      edad,
      rol_id: rolCliente.id,
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente.",
      usuario: {
        id: nuevoUsuario.id,
        nombreUsuario: nuevoUsuario.nombreUsuario,
        email: nuevoUsuario.email,
      },
    });
  } catch (err) {
    console.error("Error en registerUser:", err);
    console.error(err.stack);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  try {
    const usuario = await Usuario.findOne({
      where: {
        email,
        eliminado: false,
      },
      include: ["rol"],
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const contraseñaValida = await bcrypt.compare(password, usuario.password);
    if (!contraseñaValida) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        rol_id: usuario.rol_id,
        nombre: usuario.nombre,
        nombreUsuario: usuario.nombreUsuario,
        email: usuario.email,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        nombreUsuario: usuario.nombreUsuario,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { registerUser, loginUser };
