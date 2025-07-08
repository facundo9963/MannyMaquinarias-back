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
};

const modificarMaquina = async (req, res) => {
  try {
    const { id } = req.params;
    const { numeroSerie,nombre, marca, modelo, precio, categoria, imageUrl, sucursal_id } =
      req.body;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de máquina no válido" });
    }
    const maquina = await Maquina.findByPk(id);
    if (!maquina) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }
    
    const actualizacion = {
      numeroSerie,
      nombre,
      marca,
      modelo,
      precio,
      categoria,
      imageUrl,
      sucursal_id,
    };
    // Validar que la sucursal exista
    if (sucursal_id) {
      const sucursal = await Sucursal.findByPk(sucursal_id);
      if (!sucursal) {
        return res.status(404).json({ error: "Sucursal no encontrada" });
      }
    }
    const reservasPendientes = await Reserva.findAll({
      where: {
        maquina_id: id,
        fecha_fin: { [Op.gte]: new Date() },
      },
    });


    if (reservasPendientes.length > 0) {
      return res.status(409).json({
        error: "No se puede modificar la máquina",
        detalles: "Tiene reservas pendientes activas",
        reservas: reservasPendientes.map((r) => ({
          id: r.id,
          fecha_inicio: r.fecha_inicio,
          fecha_fin: r.fecha_fin,
        })),
      });
    }

    if (numeroSerie && numeroSerie !== maquina.numeroSerie) {
      const existente = await Maquina.findOne({
        where: {
          numeroSerie: numeroSerie,
          id: { [Op.ne]: id },
        },
      });
      if (existente) {
        return res.status(409).json({
          error: "Ese número de serie ya está asignado a otra máquina",
        });
      }
    }
    // Validar que el precio sea un número positivo
    if (precio !== undefined && (isNaN(precio) || precio < 0)) {
      return res
        .status(400)
        .json({ error: "El precio debe ser un número positivo" });
    }
    
    
    // Actualizar la máquina
    await maquina.update(actualizacion);
    return res.status(200).json({
      success: true,
      message: "Máquina actualizada correctamente",
      data: {
        id: maquina.id,
        numeroSerie: numeroSerie ?? maquina.numeroSerie,
        nombre: maquina.nombre,
        marca: maquina.marca,
        modelo: maquina.modelo,
        precio: maquina.precio,
        categoria: maquina.categoria,
        imageUrl: maquina.imageUrl,
        sucursal_id: maquina.sucursal_id,
      },
    });
  } catch (error) {
    console.error("Error en modificarMaquina:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      detalles: error.message,
    });
  }
};

const eliminarMaquina = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de máquina no válido" });
    }

    const maquina = await Maquina.findByPk(id);

    if (!maquina) {
      return res.status(404).json({
        error: "Máquina no encontrada",
        detalles: `No existe una máquina con el ID ${id}`,
      });
    }

    if (maquina.deletedAt) {
      return res.status(400).json({
        error: "La máquina ya está eliminada",
        detalles: `La máquina con ID ${id} ya fue marcada como eliminada anteriormente`,
      });
    }

    // Verificar reservas pendientes (opcional)
    const reservasPendientes = await Reserva.findAll({
      where: {
        maquina_id: id,
        fecha_fin: { [Op.gte]: new Date() },
      },
    });

    if (reservasPendientes.length > 0) {
      return res.status(409).json({
        error: "No se puede eliminar la máquina",
        detalles: "Tiene reservas pendientes activas",
        reservas: reservasPendientes.map((r) => ({
          id: r.id,
          fecha_inicio: r.fecha_inicio,
          fecha_fin: r.fecha_fin,
        })),
      });
    }

    // Borrado lógico
    await Maquina.destroy({ where: { id: maquina.id } });

    return res.status(200).json({
      success: true,
      message: "Máquina eliminada correctamente",
      data: {
        id: maquina.id,
        nombre: maquina.nombre,
        eliminado: true,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error en eliminarMaquina:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      detalles: error.message,
    });
  }
};

const obtenerMaquinaPorSerie = async (req, res) => {
  try {
    const { numeroSerie } = req.params;

    // Buscar la máquina por número de serie
    const maquina = await Maquina.findOne({ where: { numeroSerie } });

    if (!maquina) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }

    return res.status(200).json({ maquina });
  } catch (error) {
    console.error("Error al obtener la máquina por número de serie:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
const entregarMaquina = async (req, res) => {
  try {
    const { numeroSerie } = req.body;
    // Buscar la máquina por numeroSerie
    const maquina = await Maquina.findOne({ where: { numeroSerie } });
    if (!maquina) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }
    // Verificar si la máquina ya está entregada
    if (maquina.estado === "entregado") {
      return res.status(400).json({ error: "La máquina ya fue entregada" });
    }
    if (maquina.estado !== "disponible") {
      return res.status(400).json({ error: "La máquina no está disponible para entrega" });
    }
    // Actualizar el estado de la máquina a "entregado"
    await maquina.update({ estado: "entregado" });
    return res.status(200).json({ message: "Máquina entregada correctamente" });
  } catch (error) {
    console.error("Error al entregar la máquina:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

const recibirMaquina = async (req, res) => {
  try {
    const { numeroSerie } = req.body;

    // Buscar la máquina por numeroSerie
    const maquina = await Maquina.findOne({ where: { numeroSerie } });

    if (!maquina) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }

    // Verificar si la máquina ya está recibida
    if (maquina.estado != "entregado") {
      return res.status(400).json({ error: "La máquina no fue entregada" });
    }

    // Actualizar el estado de la máquina a "recibida"
    await maquina.update({ estado: "disponible" });

    return res.status(200).json({ message: "Máquina recibida correctamente" });
  } catch (error) {
    console.error("Error al recibir la máquina:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  listarMaquinas,
  agregarMaquina,
  eliminarMaquina,
  modificarMaquina,
  obtenerMaquinaPorSerie,
  recibirMaquina,
  entregarMaquina,
};
