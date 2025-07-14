const { Op, fn, col, literal } = require("sequelize");
const {
  Maquina,
  Reserva,
  Rol,
  Mantenimiento,
  Sucursal,
  PoliticaCancelacion,
  Usuario,
} = require("../../db");
const sequelize = require("sequelize");

const obtenerEstadisticasUsuarios = async (req, res) => {
  try {
    const anio = parseInt(req.query.anio);

    if (isNaN(anio)) {
      return res.status(400).json({ error: "Año inválido" });
    }

    const fechaInicio = new Date(`${anio}-01-01T00:00:00.000Z`);
    const fechaFin = new Date(`${anio}-12-31T23:59:59.999Z`);

    const resultados = await Usuario.findAll({
      attributes: [
        [fn("DATE_TRUNC", "month", col("Usuario.createdAt")), "mes"],
        [fn("COUNT", col("Usuario.id")), "cantidad"],
      ],
      include: [
        {
          model: Rol,
          as: "rol",
          where: {
            nombre: "cliente", // filtramos por nombre del rol
          },
          attributes: [], // no queremos campos del rol en el resultado
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [fechaInicio, fechaFin],
        },
      },
      group: [literal("mes")],
      order: [literal("mes")],
      raw: true,
    });

    // Convertimos el mes a formato legible
    const formateados = resultados.map((r) => {
      const fecha = new Date(r.mes);
      fecha.setUTCMonth(fecha.getUTCMonth() + 1);
      return {
        mes: fecha.toLocaleString("es-AR", { month: "long" }),
        cantidad: Number(r.cantidad),
      };
    });

    res.json(formateados);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

const obtenerEstadisticasMontos = async (req, res) => {
  try {
    const fecha_inicio = req.query.fechaInicio;
    const fecha_fin = req.query.fechaFin || Date().toISOString().split("T")[0];

    if (fecha_fin < fecha_inicio) {
      return res.status(400).json({
        error: "La fecha de fin no puede ser anterior a la fecha de inicio.",
      });
    }

    const resultados = await Reserva.findAll({
      attributes: [
        [fn("DATE_TRUNC", "day", col("fecha_reserva")), "dia"],
        [fn("SUM", col("precio")), "montoTotal"],
      ],
      where: {
        fecha_reserva: {
          [Op.between]: [fecha_inicio, fecha_fin],
        },
      },
      group: [literal("dia")],
      order: [literal("dia")],
      raw: true,
    });

    if (resultados.length === 0) {
      return res.status(404).json({
        message:
          "No se encontraron reservas en el rango de fechas especificado.",
      });
    }
    // Convertir el día a un formato más legible (opcional)
    const formateados = resultados.map((r) => {
      const fecha = new Date(r.dia);
      fecha.setUTCDate(fecha.getUTCDate() + 1); // Ajustar al día siguiente para mostrar correctamente

      return {
        dia: fecha.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        montoTotal: Number(r.montoTotal),
      };
    });
    res.json(formateados);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

const obtenerPorcentajePorCategoria = async (req, res) => {
  try {
    const categorias = await Maquina.findAll({
      attributes: ["categoria", [fn("COUNT", col("id")), "cantidad"]],
      group: "categoria",
      raw: true,
    });

    const total = categorias.reduce(
      (sum, categoria) => sum + categoria.cantidad,
      0
    );
    const cantidad = await Maquina.count();
    const porcentajes = categorias.map((categoria) => ({
      categoria: categoria.categoria,
      porcentaje: (categoria.cantidad / cantidad) * 100,
    }));

    res.json(porcentajes);
  } catch (error) {
    console.error("Error al obtener porcentajes por categoría:", error);
    res
      .status(500)
      .json({ error: "Error al obtener porcentajes por categoría" });
  }
};

module.exports = {
  obtenerEstadisticasUsuarios,
  obtenerEstadisticasMontos,
  obtenerPorcentajePorCategoria,
};
