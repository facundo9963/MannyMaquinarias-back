const { Op, fn, col, literal } = require('sequelize');
const {
  Maquina,
  Reserva,
  Mantenimiento,
  Sucursal,
  PoliticaCancelacion,
  Usuario
} = require("../../db");
const sequelize = require("sequelize");

const obtenerEstadisticasUsuarios = async (req, res) => {
  try {
    const anio = parseInt(req.query.anio);

    if (isNaN(anio)) {
      return res.status(400).json({ error: 'Año inválido' });
    }

    const fechaInicio = new Date(`${anio}-01-01T00:00:00.000Z`);
    const fechaFin = new Date(`${anio}-12-31T23:59:59.999Z`);

    const resultados = await Usuario.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('createdAt')), 'mes'],
        [fn('COUNT', col('id')), 'cantidad']
      ],
      where: {
        createdAt: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      group: [literal('mes')],
      order: [literal('mes')],
      raw: true
    });

    // Convertir el mes a un formato más legible (opcional)
  const formateados = resultados.map(r => {
  const fecha = new Date(r.mes);

  fecha.setUTCMonth(fecha.getUTCMonth()+1);

  // 🗓️ Devolvemos el nombre del mes corregido
  return {
    mes: fecha.toLocaleString('es-AR', { month: 'long' }), // devuelve "mayo" si era abril
    cantidad: Number(r.cantidad)
  };
});


    res.json(formateados);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};


const obtenerEstadisticasMontos = async (req, res) => {
  try {
    const fecha_inicio = (req.body.fechaInicio);
    const fecha_fin = (req.body.fechaFin || Date.now());

    if (fecha_fin < fecha_inicio) {
      return res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }

    const resultados = await Reserva.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'day', col('fecha_reserva')), 'dia'],
        [fn('SUM', col('precio')), 'montoTotal']
      ],
      where: {        
        fecha_reserva: {
          [Op.between]: [fecha_inicio, fecha_fin]
        }
      },
      group: [literal('dia')],
      order: [literal('dia')],
      raw: true
    });

    if (resultados.length === 0) {
      return res.status(404).json({ message: 'No se encontraron reservas en el rango de fechas especificado.' });
    }
    // Convertir el día a un formato más legible (opcional)
    const formateados = resultados.map(r => {
      const fecha = new Date(r.dia);
      fecha.setUTCDate(fecha.getUTCDate() + 1); // Ajustar al día siguiente para mostrar correctamente

      return {
        dia: fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
        montoTotal: Number(r.montoTotal)
      };
    });
    res.json(formateados);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = {
    obtenerEstadisticasUsuarios,
    obtenerEstadisticasMontos
};