const { Reserva, Maquina, Usuario, ListaNegra } = require("../../db");
const { Op, or } = require("sequelize");
const db = require("../../db"); // Asegúrate de que este es el camino correcto a tu archivo de configuración de la base de datos
const { Order } = require("mercadopago");

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
          as: 'maquina',
          attributes: ['id', 'nombre'], // Ajustar según tu modelo
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
      where: { eliminado: false, pagada: true },
      order: [['id']],
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'email', 'apellido'],
        },
        {
          model: Maquina,
          as: 'maquina',
          attributes: ['id', 'nombre'],
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
      order: [['id']], // Ordenar por ID descendente
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'email', 'apellido'],
        },
        {
          model: Maquina,
          as: 'maquina',
          attributes: ['id', 'nombre'],
        },
      ],
    });
   

    if (reservas.length === 0) {
      return res.status(404).json({ message: "No hay historial de reservas" });
    }

    res.json(reservas);
  } catch (error) {
    console.error("Error al obtener el historial de reservas:", error);
    res.status(500).json({ error: "Error al obtener el historial de reservas" });
  }
}

module.exports = {
  crearReserva,
  obtenerReservasPropias,
  obtenerTodasReservas,
  historialReservasUsuario,
};
