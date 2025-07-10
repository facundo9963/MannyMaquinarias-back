const { Maquina, Mantenimiento, Reserva, Usuario } = require("../../db");
const { Op } = require("sequelize");

const startMantenimiento = async (req, res) => {
  const { id } = req.params;
  const { nombre, detalle, fechaFin } = req.body;

  try {
    // Validar fechaFin obligatoria
    if (!fechaFin) {
      return res
        .status(400)
        .json({ message: "La fecha de fin es obligatoria." });
    }

    const parsedFechaFin = new Date(fechaFin);
    if (isNaN(parsedFechaFin.getTime())) {
      return res
        .status(400)
        .json({ message: "La fecha de fin no es una fecha válida." });
    }

    const maquina = await Maquina.findByPk(id);

    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }

    if (maquina.estado !== "disponible") {
      return res.status(400).json({
        message: `La máquina no está disponible. Estado actual: ${maquina.estado}.`,
      });
    }

    // Cambiar estado de la máquina
    maquina.estado = "en mantenimiento";
    await maquina.save();

    // Crear el mantenimiento
    const mantenimiento = await Mantenimiento.create({
      nombre,
      detalle,
      fechaInicio: new Date(),
      fechaFin: parsedFechaFin,
      maquina_id: maquina.id,
    });

    // Buscar reservas activas que se superponen con el mantenimiento
    const reservas = await Reserva.findAll({
      where: {
        maquina_id: maquina.id,
        fecha_inicio: {
          [Op.lte]: parsedFechaFin,
        },
        eliminado: false,
      },
    });

    const reservasCanceladas = [];

    for (const reserva of reservas) {
      // Buscar al usuario
      const usuario = await Usuario.findByPk(reserva.usuario_id);
      if (usuario) {
        const montoActual = parseFloat(usuario.monto) || 0;
        const precioReserva = parseFloat(reserva.precio) || 0;
        usuario.monto = (montoActual + precioReserva).toFixed(2); // mantener decimal
        await usuario.save();
      }

      // Cancelar la reserva y dejar constancia
      await reserva.update({
        eliminado: true,
        precio: 0,
      });

      reservasCanceladas.push({
        id: reserva.id,
        fecha_inicio: reserva.fecha_inicio,
        fecha_fin: reserva.fecha_fin,
      });
    }

    res.status(200).json({
      message: "Máquina puesta en mantenimiento y reservas canceladas.",
      maquina,
      mantenimiento,
      reservasCanceladas,
    });
  } catch (error) {
    console.error("Error al poner la máquina en mantenimiento:", error);
    res
      .status(500)
      .json({ message: "Error al poner la máquina en mantenimiento." });
  }
};

// Sacar la máquina de mantenimiento
const finishMantenimiento = async (req, res) => {
  const { id } = req.params;

  try {
    const maquina = await Maquina.findByPk(id);

    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }

    if (maquina.estado !== "en mantenimiento") {
      return res.status(400).json({
        message: `La máquina no está en mantenimiento. Estado actual: ${maquina.estado}.`,
      });
    }

    // Cambiar estado
    maquina.estado = "disponible";
    await maquina.save();

    res.status(200).json({
      message: "Máquina sacada de mantenimiento.",
      maquina,
    });
  } catch (error) {
    console.error("Error al sacar la máquina de mantenimiento:", error);
    res
      .status(500)
      .json({ message: "Error al sacar la máquina de mantenimiento." });
  }
};

module.exports = {
  startMantenimiento,
  finishMantenimiento,
};
