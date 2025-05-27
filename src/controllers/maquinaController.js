const { Op } = require("sequelize");
const {
  Maquina,
  Reserva,
  Mantenimiento,
  Sucursal,
  PoliticaCancelacion,
} = require("../../db");

const listarMaquinas = async (req, res) => {
  try {
    const {
      localidad,
      precioMin,
      precioMax,
      categoria,
      fechaInicio,
      fechaFin,
      search,
    } = req.query;

    // Construimos el objeto de condiciones WHERE
    const whereConditions = {};

    // Filtro por búsqueda general (nombre, marca o modelo)
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { marca: { [Op.iLike]: `%${search}%` } },
        { modelo: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Filtro por categoría
    if (categoria) whereConditions.categoria = categoria;

    // Filtro por rango de precio
    if (precioMin !== undefined || precioMax !== undefined) {
      whereConditions.precio = {};
      if (precioMin !== undefined) whereConditions.precio[Op.gte] = precioMin;
      if (precioMax !== undefined) whereConditions.precio[Op.lte] = precioMax;
    }

    // Construimos el objeto de include para Sucursal
    const includeSucursal = {
      model: Sucursal,
      as: "sucursal",
      attributes: ["id", "localidad"],
      required: false,
    };

    // Filtro por localidad
    if (localidad) {
      includeSucursal.required = true;
      includeSucursal.where = { localidad };
    }

    // Condición para filtrar por disponibilidad en fechas
    let maquinasNoDisponiblesIds = [];
    if (fechaInicio && fechaFin) {
      const fechaInicioObj = new Date(fechaInicio);
      const fechaFinObj = new Date(fechaFin);
      const ahora = new Date();

      // 1. Máquinas con reservas en el rango solicitado
      const reservasConflictivas = await Reserva.findAll({
        where: {
          [Op.or]: [
            // Reservas que empiezan dentro del rango solicitado
            {
              fecha_inicio: { [Op.between]: [fechaInicioObj, fechaFinObj] },
            },
            // Reservas que terminan dentro del rango solicitado (incluyendo día de checkeo)
            {
              fecha_fin: {
                [Op.between]: [
                  new Date(fechaInicioObj.getTime() - 24 * 60 * 60 * 1000), // Restamos 1 día (para incluir día de checkeo)
                  fechaFinObj,
                ],
              },
            },
            // Reservas que engloban el rango solicitado
            {
              fecha_inicio: { [Op.lte]: fechaInicioObj },
              fecha_fin: { [Op.gte]: fechaFinObj },
            },
            // Reservas que terminan justo antes del rango (su día de checkeo cae dentro)
            {
              fecha_fin: {
                [Op.eq]: new Date(
                  fechaInicioObj.getTime() - 24 * 60 * 60 * 1000
                ), // Justo 1 día antes
              },
            },
          ],
        },
        attributes: ["maquina_id"],
        raw: true,
      });

      maquinasNoDisponiblesIds = reservasConflictivas.map((r) => r.maquina_id);

      // 2. Máquinas en mantenimiento actual (sin fechaFin o con fechaFin > ahora)
      const mantenimientosActivos = await Mantenimiento.findAll({
        where: {
          [Op.or]: [
            {
              fechaFin: null, // Mantenimientos sin fecha fin (activos)
            },
            {
              fechaFin: { [Op.gt]: ahora }, // Mantenimientos que aún no terminan
            },
          ],
        },
        attributes: ["maquina_id"],
        raw: true,
      });

      const maquinasEnMantenimientoIds = mantenimientosActivos.map(
        (m) => m.maquina_id
      );
      maquinasNoDisponiblesIds = [
        ...new Set([
          ...maquinasNoDisponiblesIds,
          ...maquinasEnMantenimientoIds,
        ]),
      ];
    }

    // Si hay filtro por fechas, excluimos las máquinas no disponibles
    if (fechaInicio && fechaFin) {
      whereConditions.id = { [Op.notIn]: maquinasNoDisponiblesIds };
    }

    const maquinas = await Maquina.findAll({
      where: whereConditions,
      include: [
        includeSucursal,
        {
          model: Reserva,
          as: "reservas",
          required: false,
        },
        {
          model: Mantenimiento,
          as: "mantenimientos",
          required: false,
          where: {
            [Op.or]: [
              { fechaFin: null },
              { fechaFin: { [Op.gt]: new Date() } },
            ],
          },
        },
        {
          model: PoliticaCancelacion,
          as: "politicaCancelacion",
          required: false,
        },
      ],
    });

    res.status(200).json(maquinas);
  } catch (error) {
    console.error("Error al listar máquinas con relaciones:", error);
    res
      .status(500)
      .json({ message: "Error al obtener las máquinas", error: error.message });
  }
};

const agregarMaquina = async (req, res) => {
    try {
        const nuevaMaquina = await Maquina.create(req.body);
        res.status(201).json(nuevaMaquina);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const eliminarMaquina = async (req, res) => {
    try {
        const { id } = req.params;
        const maquina = await Maquina.findByPk(id);
        
        if (!maquina) {
            return res.status(404).json({ error: 'Máquina no encontrada' });
        }
        if (maquina.reservas.length > 0) {
            return res.status(400).json({ error: 'No se puede eliminar una máquina con reservas activas' });
        }
        await maquina.destroy();
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {listarMaquinas, agregarMaquina, eliminarMaquina};
