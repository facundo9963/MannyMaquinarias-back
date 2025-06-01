const { Reserva, Maquina, Usuario, ListaNegra } = require("../../db");
const db = require("../../db"); // Asegúrate de que este es el camino correcto a tu archivo de configuración de la base de datos

const crearReserva = async (req, res) => {
    const { precio, fecha_inicio, fecha_fin, usuario_id, maquina_id } = req.body;

    if (!precio || !fecha_inicio || !fecha_fin || !usuario_id || !maquina_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const usuarioEnListaNegra = await ListaNegra.findOne({ where: { usuario_id } });
    if (usuarioEnListaNegra) {
        return res.status(403).json({ error: 'El usuario está en la lista negra y no puede hacer reservas' });
    }
  try {
    const nuevaReserva = await Reserva.create({
      precio,
      fecha_inicio,
      fecha_fin,
      usuario_id,
      maquina_id,
    });

    res.status(201).json(nuevaReserva);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

const obtenerReservasPropias = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const reservas = await Reserva.findAll({
      where: { usuario_id: usuarioId },
      include: [
        {
          model: db.Maquina,
          as: 'maquina',
          attributes: ['id', 'nombre'], // Ajustar según tu modelo
        },
      ],
    });
    if (reservas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron reservas para este usuario' });
    }   
    res.json(reservas);
  } catch (error) {
    console.error('Error al obtener reservas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener las reservas del usuario' });
  }
};

module.exports = {
  crearReserva,
  obtenerReservasPropias,
};