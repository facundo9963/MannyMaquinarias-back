const { Maquina, Mantenimiento, Reserva } = require("../../db");
const { Op } = require("sequelize");

// Poner una máquina en mantenimiento
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

    // Cambiar estado
    maquina.estado = "en mantenimiento";
    await maquina.save();

    // Crear mantenimiento con fechaFin
    const mantenimiento = await Mantenimiento.create({
      nombre,
      detalle,
      fechaInicio: new Date(),
      fechaFin: parsedFechaFin,
      maquina_id: maquina.id,
    });

    // Buscar y marcar reservas como eliminadas
    const reservas = await Reserva.findAll({
      where: {
        maquina_id: maquina.id,
        fecha_inicio: {
          [Op.lte]: fechaFin,
        },
        eliminado: false, // solo reservas activas
      },
    });

    for (const reserva of reservas) {
      await reserva.update({ eliminado: true });
    }

    res.status(200).json({
      message: "Máquina puesta en mantenimiento y reservas canceladas.",
      maquina,
      mantenimiento,
      reservasCanceladas: reservas.map((r) => ({
        id: r.id,
        fecha_inicio: r.fecha_inicio,
        fecha_fin: r.fecha_fin,
      })),
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
