const { Usuario, Rol, Reserva } = require("../../db");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

const createUser = async (req, res) => {
  const usuarioLogueado = req.usuarioLogueado;
  const {
    dni,
    nombreUsuario,
    nombre,
    apellido,
    password,
    email,
    direccion,
    edad,
    rol,
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
      email,
      direccion,
      edad,
      rol_id: rolDB.id,
    });

    return res.status(201).json({
      message: "Usuario creado correctamente.",
      usuario: {
        id: nuevoUsuario.id,
        nombreUsuario: nuevoUsuario.nombreUsuario,
        email: nuevoUsuario.email,
        rol: rolDB.nombre,
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
    currentPassword,
    newPassword,
  } = req.body;

  try {
    const usuario = await Usuario.findByPk(usuarioLogueado.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (newPassword?.trim().length > 0) {
      if (!currentPassword || typeof currentPassword !== "string") {
        return res
          .status(400)
          .json({ error: "Debes ingresar tu contraseña actual." });
      }

      const esValida = await bcrypt.compare(currentPassword, usuario.password);
      if (!esValida) {
        return res
          .status(401)
          .json({ error: "Contraseña actual incorrecta." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      usuario.password = hashedPassword;
    }

    if (dni && dni !== usuario.dni) {
      const existeDni = await Usuario.findOne({ where: { dni } });
      if (existeDni) {
        return res
          .status(409)
          .json({ error: "El DNI ya está en uso por otro usuario." });
      }
    }

    usuario.dni = dni ?? usuario.dni;
    usuario.nombreUsuario = nombreUsuario ?? usuario.nombreUsuario;
    usuario.nombre = nombre ?? usuario.nombre;
    usuario.apellido = apellido ?? usuario.apellido;
    usuario.email = email ?? usuario.email;
    usuario.direccion = direccion ?? usuario.direccion;
    usuario.edad = edad ?? usuario.edad;

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

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "El DNI ya está en uso.",
      });
    }

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
