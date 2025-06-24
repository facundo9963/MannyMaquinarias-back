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
    const anio = parseInt(req.body.anio);

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
module.exports = {
    obtenerEstadisticasUsuarios
};