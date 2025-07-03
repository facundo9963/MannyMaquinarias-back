const { Usuario, Rol, Reserva } = require("../../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { enviarEmail } = require("../helpers/emailSender");

const createUser = async (req, res) => {
  const { email, edad, rolCreador } = req.body;

  try {
    // Validar datos obligatorios
    if (!email || edad === undefined || !rolCreador) {
      return res
        .status(400)
        .json({ error: "Email, edad y rolCreador son obligatorios." });
    }

    // Validar que edad sea un número
    if (isNaN(edad)) {
      return res.status(400).json({ error: "La edad debe ser un número." });
    }

    // Validar que la edad sea mayor a 18
    if (parseInt(edad) <= 18) {
      return res
        .status(400)
        .json({ error: "La edad debe ser mayor a 18 años." });
    }

    // Verificar si ya existe un usuario con ese email
    const emailExistente = await Usuario.findOne({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // Determinar rol a asignar
    let rolNuevoNombre;
    const rolCreadorLower = rolCreador.toLowerCase().trim();

    if (rolCreadorLower === "admin") {
      rolNuevoNombre = "trabajador";
    } else if (rolCreadorLower === "trabajador") {
      rolNuevoNombre = "cliente";
    } else {
      return res
        .status(400)
        .json({ error: "El rolCreador debe ser 'admin' o 'trabajador'." });
    }

    // Buscar el rol en DB
    const rolNuevo = await Rol.findOne({ where: { nombre: rolNuevoNombre } });
    if (!rolNuevo) {
      return res
        .status(400)
        .json({ error: `El rol "${rolNuevoNombre}" no existe.` });
    }

    // Generar contraseña aleatoria
    const passwordPlano = crypto.randomBytes(6).toString("base64").slice(0, 10); // 10 caracteres aprox

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(passwordPlano, 10);

    // Crear el usuario
    const nuevoUsuario = await Usuario.create({
      email,
      edad,
      password: hashedPassword,
      rol_id: rolNuevo.id,
    });

    // Enviar email con la contraseña
    const mensaje = `
    ¡Ya podés iniciar sesión en la web de MannyMaquinarias!

    Tu contraseña es: ${passwordPlano}

    Te recomendamos cambiarla al iniciar sesión.
    `;

    await enviarEmail(email, "Bienvenido a MannyMaquinarias", mensaje);

    return res.status(201).json({
      message: `Usuario creado correctamente con rol "${rolNuevoNombre}".`,
      usuario: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        edad: nuevoUsuario.edad,
        rol: rolNuevo.nombre,
        passwordGenerada: passwordPlano, // Mostrar solo una vez
      },
    });
  } catch (err) {
    console.error("Error en createUser:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const usuarioLogueado = req.usuarioLogueado;
    console.log(usuarioLogueado);

    // Verificar si el usuario es administrador
    if (
      usuarioLogueado.rol &&
      usuarioLogueado.rol.nombre.toLowerCase().trim() === "admin"
    ) {
      return res.status(403).json({
        error: "No puedes eliminar tu cuenta porque eres administrador.",
      });
    }

    // Verificar si tiene reservas pendientes
    const reservasPendientes = await Reserva.findAll({
      where: {
        usuario_id: usuarioLogueado.id,
        fecha_fin: {
          [Op.gte]: new Date(),
        },
      },
    });

    if (reservasPendientes.length > 0) {
      return res.status(400).json({
        error:
          "No puedes eliminar tu cuenta porque tienes reservas pendientes.",
        reservasPendientes: reservasPendientes.map((r) => ({
          id: r.id,
          fechaFin: r.fecha_fin,
          estado: r.estado,
        })),
      });
    }

    // Borrado lógico
    usuarioLogueado.eliminado = true;
    await usuarioLogueado.save();

    return res.status(200).json({
      message: "Cuenta eliminada exitosamente (borrado lógico)",
      usuario: {
        id: usuarioLogueado.id,
        nombreUsuario: usuarioLogueado.nombreUsuario,
        email: usuarioLogueado.email,
      },
    });
  } catch (error) {
    console.error("Error en eliminarUsuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const eliminarUsuarioPorAdmin = async (req, res) => {
  try {
    const { email } = req.params;
    const emailAdmin = req.usuarioLogueado.email;

    // Impedir que el admin se elimine a sí mismo
    if (email === emailAdmin) {
      return res.status(403).json({
        error:
          "No puedes eliminar tu propia cuenta desde esta acción de administrador.",
      });
    }

    // Buscar el usuario por email
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar si tiene reservas pendientes
    const reservasPendientes = await Reserva.findAll({
      where: {
        usuario_id: usuario.id,
        fecha_fin: {
          [Op.gte]: new Date(),
        },
      },
    });

    if (reservasPendientes.length > 0) {
      return res.status(400).json({
        error:
          "No puedes eliminar este usuario porque tiene reservas pendientes.",
        reservasPendientes: reservasPendientes.map((r) => ({
          id: r.id,
          fechaFin: r.fecha_fin,
          estado: r.estado,
        })),
      });
    }

    // Borrado lógico
    usuario.eliminado = true;
    await usuario.save();

    return res.status(200).json({
      message: "Usuario eliminado exitosamente (borrado lógico)",
      usuario: {
        id: usuario.id,
        nombreUsuario: usuario.nombreUsuario,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error("Error en eliminarUsuarioPorAdmin:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const listarInformacionUsuario = async (req, res) => {
  try {
    const usuarioLogueado = req.usuarioLogueado;

    if (!usuarioLogueado) {
      return res.status(403).json({ error: "No autorizado." });
    }

    const usuario = await Usuario.findByPk(usuarioLogueado.id, {
      attributes: ["dni", "nombre", "apellido", "email", "direccion", "edad"],
      include: [
        {
          model: Rol,
          as: "rol",
          attributes: ["nombre"],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Error en ListarInformacionUsuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const modificarUsuario = async (req, res) => {
  const usuarioLogueado = req.usuarioLogueado;
  const {
    dni,
    nombreUsuario,
    nombre,
    apellido,
    email,
    direccion,
    edad,
    password,
  } = req.body;
  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(usuarioLogueado.id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Actualizar los campos del usuario
    usuario.dni = dni || usuario.dni;
    usuario.nombreUsuario = nombreUsuario || usuario.nombreUsuario;
    usuario.nombre = nombre || usuario.nombre;
    usuario.apellido = apellido || usuario.apellido;
    usuario.email = email || usuario.email;
    usuario.direccion = direccion || usuario.direccion;
    usuario.edad = edad || usuario.edad;
    usuario.password = hashedPassword || usuario.password;

    await usuario.save();

    return res.status(200).json({
      message: "Usuario modificado correctamente.",
      usuario: {
        id: usuario.id,
        nombreUsuario: usuario.nombreUsuario,
        email: usuario.email,
      },
    });
  } catch (err) {
    console.error("Error en modificarUsuario:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

const verUsuarios = async (req, res) => {
  const { rol } = req.body;
  if (rol && isNaN(rol)) {
    return res.status(400).json({ error: "El rol debe ser un número." });
  }

  try {
    let usuarios;
    if (!rol) {
      usuarios = await Usuario.findAll({
        where: { eliminado: false },
        attributes: [
          "id",
          "dni",
          "nombre",
          "apellido",
          "email",
          "direccion",
          "edad",
        ],
        include: [
          {
            model: Rol,
            as: "rol",
            attributes: ["nombre"],
          },
        ],
      });
    } else {
      usuarios = await Usuario.findAll({
        where: { rol_id: rol },
        attributes: [
          "id",
          "dni",
          "nombre",
          "apellido",
          "email",
          "direccion",
          "edad",
        ],
        include: [
          {
            model: Rol,
            as: "rol",
            attributes: ["nombre"],
          },
        ],
      });
    }
    if (usuarios.length === 0) {
      return res.status(404).json({ message: "No se encontraron usuarios." });
    }

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios por rol:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};
module.exports = {
  createUser,
  eliminarUsuario,
  eliminarUsuarioPorAdmin,
  listarInformacionUsuario,
  modificarUsuario,
  verUsuarios,
};
