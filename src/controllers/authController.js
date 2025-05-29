const { Usuario, Rol } = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  console.log(req.body);
  const {
    dni,
    nombreUsuario,
    nombre,
    apellido,
    password,
    email,
    direccion,
    fechaNacimiento, // Cambiamos edad por fechaNacimiento
  } = req.body;

  // Validar campos obligatorios
  if (!email || !password || !fechaNacimiento) {
    return res
      .status(400)
      .json({
        error: "Email, contraseña y fecha de nacimiento son obligatorios.",
      });
  }

  try {
    // Validar que fechaNacimiento sea una fecha válida
    const fechaNac = new Date(fechaNacimiento);
    if (isNaN(fechaNac.getTime())) {
      return res.status(400).json({ error: "Fecha de nacimiento no válida." });
    }

    // Calcular la edad
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    // Validar que el usuario sea mayor de 18 años
    if (edad < 18) {
      return res
        .status(400)
        .json({ error: "Debes ser mayor de 18 años para registrarte." });
    }

    const checks = [];

    if (dni) checks.push(Usuario.findOne({ where: { dni } }));
    else checks.push(null);

    if (nombreUsuario)
      checks.push(Usuario.findOne({ where: { nombreUsuario } }));
    else checks.push(null);

    checks.push(Usuario.findOne({ where: { email } }));

    const [dniExistente, usuarioExistente, emailExistente] = await Promise.all(
      checks
    );

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
      dni: dni || null,
      nombreUsuario: nombreUsuario || null,
      nombre: nombre || null,
      apellido: apellido || null,
      password: hashedPassword,
      email,
      direccion: direccion || null,
      edad,
      rol_id: rolCliente.id,
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente.",
      usuario: {
        id: nuevoUsuario.id,
        nombreUsuario: nuevoUsuario.nombreUsuario,
        email: nuevoUsuario.email,
        edad: nuevoUsuario.edad,
      },
    });
  } catch (err) {
    console.error("Error en registerUser:", err);
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
