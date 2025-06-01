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
    const { id } = req.params;
    const idAdmin = req.usuarioLogueado.id;

    // Impedir que el admin se elimine a sí mismo
    if (parseInt(id) === idAdmin) {
      return res.status(403).json({
        error:
          "No puedes eliminar tu propia cuenta desde esta acción de administrador.",
      });
    }

    // Buscar el usuario por ID
    const usuario = await Usuario.findByPk(id);

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

module.exports = { createUser, eliminarUsuario, eliminarUsuarioPorAdmin };
