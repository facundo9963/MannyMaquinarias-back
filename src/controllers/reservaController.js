const {
  Reserva,
  Maquina,
  Usuario,
  ListaNegra,
  PoliticaCancelacion,
} = require("../../db");
const { Op, or } = require("sequelize");
const db = require("../../db"); // Asegúrate de que este es el camino correcto a tu archivo de configuración de la base de datos
const { Order } = require("mercadopago");
const usuario = require("../models/usuario");
const { parse } = require("dotenv");

const crearReserva = async (req, res) => {
  const usuarioLogueado = req.usuarioLogueado;
  const { precio, fecha_inicio, fecha_fin, maquina_id } = req.body;

  if (!precio || !fecha_inicio || !fecha_fin || !maquina_id) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);

  const unDiaAntes = new Date(inicio);
  unDiaAntes.setDate(unDiaAntes.getDate() - 1);

  const unDiaDespues = new Date(fin);
  unDiaDespues.setDate(unDiaDespues.getDate() + 1);

  // Buscar si hay conflictos con otras reservas que NO estén eliminadas
  const conflicto = await Reserva.findOne({
    where: {
      maquina_id,
      eliminado: false, // Solo reservas activas
      pagada: false, // Solo reservas pagadas
      [Op.or]: [
        // 1. Superposición de fechas
        {
          fecha_inicio: { [Op.lte]: fin },
          fecha_fin: { [Op.gte]: inicio },
        },
        // 2. Termina 1 día antes
        {
          fecha_fin: unDiaAntes,
        },
        // 3. Comienza 1 día después
        {
          fecha_inicio: unDiaDespues,
        },
      ],
    },
  });

  if (conflicto) {
    return res.status(400).json({
      error:
        "No se puede crear la reserva: hay un conflicto con otra reserva existente",
    });
  }

  const usuario_id = usuarioLogueado.id;

  const usuarioEnListaNegra = await ListaNegra.findOne({
    where: { usuario_id },
  });
  if (usuarioEnListaNegra) {
    return res.status(403).json({
      error: "El usuario está en la lista negra y no puede hacer reservas",
    });
  }

  const maquina = await Maquina.findByPk(maquina_id);
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  const precioEsperado = parseFloat((maquina.precio * dias).toFixed(2));
  if (precio !== precioEsperado) {
    return res.status(400).json({
      error: "El precio no coincide con el precio diario de la máquina",
    });
  }

  try {
    const nuevaReserva = await Reserva.create({
      precio,
      fecha_inicio,
      fecha_fin,
      pagada: false,
      usuario_id: usuarioLogueado.id,
      maquina_id,
      eliminado: false, // La reserva nueva siempre inicia activa
      pagada: true, // Asumimos que la reserva se crea como pagada
    });

    res.status(201).json(nuevaReserva);
  } catch (error) {
    console.error("Error al crear reserva:", error);
    res
      .status(500)
      .json({ error: error.message || "Error interno del servidor" });
  }
};

const obtenerReservasPropias = async (req, res) => {
  const usuarioLogueado = req.usuarioLogueado;

  try {
    const reservas = await Reserva.findAll({
      where: { usuario_id: usuarioLogueado.id, eliminado: false, pagada: true },
      include: [
        {
          model: db.Maquina,
          as: "maquina",
          attributes: ["id", "nombre"], // Ajustar según tu modelo
        },
      ],
    });
    if (reservas.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron reservas para este usuario" });
    }
    res.json(reservas);
  } catch (error) {
    console.error("Error al obtener reservas del usuario:", error);
    res
      .status(500)
      .json({ error: "Error al obtener las reservas del usuario" });
  }
};

const obtenerTodasReservas = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      where: { eliminado: false, pagada: true }, // Solo reservas activas y pagadas
      order: [["id"]],
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "email", "apellido"],
        },
        {
          model: Maquina,
          as: "maquina",
          attributes: ["id", "nombre"],
        },
      ],
    });
    if (reservas.length === 0) {
      return res.status(404).json({ message: "No hay reservas registradas" });
    }

    res.json(reservas);
  } catch (error) {
    console.error("Error al obtener todas las reservas:", error);
    res.status(500).json({ error: "Error al obtener las reservas" });
  }
};

const historialReservasUsuario = async (req, res) => {
  try {
    const email = req.query.email;
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const reservas = await Reserva.findAll({
      where: {
        usuario_id: usuario.id,
        eliminado: false, // Solo reservas eliminadas
        pagada: true, // Solo reservas pagadas
      },
      order: [["id"]], // Ordenar por ID descendente
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "email", "apellido"],
        },
        {
          model: Maquina,
          as: "maquina",
          attributes: ["id", "nombre"],
        },
      ],
    });

    if (reservas.length === 0) {
      return res.status(404).json({ message: "No hay historial de reservas" });
    }

    res.json(reservas);
  } catch (error) {
    console.error("Error al obtener el historial de reservas:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el historial de reservas" });
  }
};

const cancelarReserva = async (req, res) => {
  const reservaId = req.body.reservaId || req.query.reservaId; // Asumiendo que el ID de la reserva se pasa como parámetro en la URL
  const usuarioLogueado = req.usuarioLogueado;

  try {
    if (!reservaId) {
      return res.status(400).json({ error: "ID de reserva es obligatorio" });
    }
    if (isNaN(reservaId)) {
      return res
        .status(400)
        .json({ error: "ID de reserva debe ser un número" });
    }
    const reserva = await Reserva.findOne({
      where: {
        id: reservaId,
        usuario_id: usuarioLogueado.id,
        eliminado: false,
      },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }
    const maquina = await Maquina.findByPk(reserva.maquina_id);
    if (!maquina) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }
    const politicaCancelacion = await PoliticaCancelacion.findByPk(
      maquina.politica_cancelacion_id
    );
    if (!politicaCancelacion) {
      return res
        .status(404)
        .json({ error: "Política de cancelación no encontrada" });
    }
    const porcentaje = politicaCancelacion.porcentajeRembolso;
    const precioReserva = reserva.precio;
    if (isNaN(porcentaje) || isNaN(precioReserva)) {
      return res
        .status(400)
        .json({ error: "Datos de política de cancelación inválidos" });
    }
    const usuario = await Usuario.findByPk(usuarioLogueado.id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const montoDevolver = parseFloat(usuario.monto);
    usuario.monto = montoDevolver + (porcentaje / 100.0) * precioReserva;
    await usuario.save();
    reserva.precio = ((100.0 - porcentaje) / 100.0) * precioReserva; // Ajustar el precio de la reserva
    reserva.eliminado = true;
    await reserva.save();

    res.json({ message: "Reserva cancelada exitosamente" });
  } catch (error) {
    console.error("Error al cancelar la reserva:", error);
    res.status(500).json({ error: "Error al cancelar la reserva" });
  }
};

const crearReservaEmpleado = async (req, res) => {
  const { email, precio, fecha_inicio, fecha_fin, maquina_id } = req.body;
  if (!email || !precio || !fecha_inicio || !fecha_fin || !maquina_id) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);

  const unDiaAntes = new Date(inicio);
  unDiaAntes.setDate(unDiaAntes.getDate() - 1);

  const unDiaDespues = new Date(fin);
  unDiaDespues.setDate(unDiaDespues.getDate() + 1);

  // Buscar si hay conflictos con otras reservas que NO estén eliminadas
  const conflicto = await Reserva.findOne({
    where: {
      maquina_id,
      eliminado: false, // Solo reservas activas
      pagada: true, // Solo reservas pagadas
      [Op.or]: [
        // 1. Superposición de fechas
        {
          fecha_inicio: { [Op.lte]: fin },
          fecha_fin: { [Op.gte]: inicio },
        },
        // 2. Termina 1 día antes
        {
          fecha_fin: unDiaAntes,
        },
        // 3. Comienza 1 día después
        {
          fecha_inicio: unDiaDespues,
        },
      ],
    },
  });

  if (conflicto) {
    return res.status(400).json({
      error:
        "No se puede crear la reserva: hay un conflicto con otra reserva existente",
    });
  }

  const usuario_id = usuario.id;

  const usuarioEnListaNegra = await ListaNegra.findOne({
    where: { usuario_id },
  });
  if (usuarioEnListaNegra) {
    return res.status(403).json({
      error: "El usuario está en la lista negra y no puede hacer reservas",
    });
  }

  const maquina = await Maquina.findByPk(maquina_id);
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  const precioEsperado = parseFloat((maquina.precio * dias).toFixed(2));
  if (precio !== precioEsperado) {
    return res.status(400).json({
      error: "El precio no coincide con el precio diario de la máquina",
    });
  }

  try {
    const nuevaReserva = await Reserva.create({
      precio,
      fecha_inicio,
      fecha_fin,
      pagada: false,
      usuario_id: usuario_id,
      maquina_id,
      eliminado: false, // La reserva nueva siempre inicia activa
      pagada: true, // Asumimos que la reserva se crea como pagada
    });

    res.status(201).json(nuevaReserva);
  } catch (error) {
    console.error("Error al crear reserva:", error);
    res
      .status(500)
      .json({ error: error.message || "Error interno del servidor" });
  }
};

const eliminarReserva = async (req, res) => {
  const {reservaId} =  req.query; // Asumiendo que el ID de la reserva se pasa como parámetro en la URL
  const reserva = await Reserva.findByPk(reservaId);
  if (!reserva) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }
  if (reserva.eliminado) {
    return res.status(400).json({ error: "La reserva ya está eliminada" });
  }
  try {
    const usuario = await Usuario.findByPk(reserva.usuario_id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const montoDevolver = parseFloat(usuario.monto);
    const precioReserva = parseFloat(reserva.precio); // Precio de la reserva
    usuario.monto = montoDevolver + precioReserva; // Devolver el monto al usuario
    await usuario.save(); // Guardar los cambios en el usuario
    reserva.eliminado = true; // Marcar la reserva como eliminada
    reserva.precio = 0; // Ajustar el precio de la reserva a 0
    await reserva.save();
    res.json({ message: "Reserva eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar la reserva:", error);
    res.status(500).json({ error: "Error al eliminar la reserva" });
  }
};

const obtenerReservasPorFecha = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: "Faltan parámetros de fecha" });
  }

  try {
    const reservas = await Reserva.findAll({
      where: {
        [Op.and]: [
          { fecha_inicio: { [Op.lte]: new Date(fecha_fin) } }, // Empieza antes de que termine el rango
          { fecha_fin: { [Op.gte]: new Date(fecha_inicio) } }, // Termina después de que empiece el rango
        ],
        eliminado: false,
        pagada: true,
      },
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "email", "apellido"],
        },
        {
          model: Maquina,
          as: "maquina",
          attributes: ["id", "nombre"],
        },
      ],
    });

    if (reservas.length === 0) {
      return res.status(404).json({
        message:
          "No se encontraron reservas en el rango de fechas especificado",
      });
    }

    res.json(reservas);
  } catch (error) {
    console.error("Error al obtener reservas por fecha:", error);
    res.status(500).json({ error: "Error al obtener las reservas por fecha" });
  }
};

module.exports = {
  crearReserva,
  obtenerReservasPropias,
  obtenerTodasReservas,
  historialReservasUsuario,
  cancelarReserva,
  crearReservaEmpleado,
  eliminarReserva,
  obtenerReservasPorFecha,
};
