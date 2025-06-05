const { Reserva, Maquina, Usuario, ListaNegra } = require("../../db");
const { Op } = require("sequelize");
const db = require("../../db"); // Asegúrate de que este es el camino correcto a tu archivo de configuración de la base de datos

const crearReserva = async (req, res) => {
    const usuarioLogueado = req.usuarioLogueado;
    const { precio, fecha_inicio, fecha_fin, maquina_id } = req.body;
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);

    const unDiaAntes = new Date(inicio);
    unDiaAntes.setDate(unDiaAntes.getDate() - 1);

    const unDiaDespues = new Date(fin);
    unDiaDespues.setDate(unDiaDespues.getDate() + 1);

    // Buscar si hay conflictos con otras reservas
    const conflicto = await Reserva.findOne({
      where: {
        maquina_id,
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
    
    const maquinaExiste = await Maquina.findByPk(maquina_id);
    if (!maquinaExiste) {
      return res.status(404).json({ error: 'La máquina especificada no existe' });
    }

    if (conflicto) {
      return res.status(400).json({
        error: "No se puede crear la reserva: hay un conflicto con otra reserva existente",
      });
    }

    if (!precio || !fecha_inicio || !fecha_fin || !maquina_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const usuario_id = usuarioLogueado.id;
    const usuarioEnListaNegra = await ListaNegra.findOne({ where: { usuario_id } });
    if (usuarioEnListaNegra) {
        return res.status(403).json({ error: 'El usuario está en la lista negra y no puede hacer reservas' });
    }
    const maquina = await Maquina.findByPk(maquina_id);
    if (precio !== maquina.precio * Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))) {
        return res.status(400).json({ error: 'El precio no coincide con el precio diario de la máquina' });
    }
  try {
    const nuevaReserva = await Reserva.create({
      precio,
      fecha_inicio,
      fecha_fin,
      usuario_id: usuarioLogueado.id,
      maquina_id,
    });

    res.status(201).json(nuevaReserva);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

const obtenerReservasPropias = async (req, res) => {
  const usuarioLogueado = req.usuarioLogueado;

  try {
    const reservas = await Reserva.findAll({
      where: { usuario_id: usuarioLogueado.id },
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

const marcarComoPagada = async (req, res) => {
  const { reservaId } = req.params;

  try {
    const reserva = await Reserva.findByPk(reservaId);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Aquí podrías agregar lógica para marcar la reserva como pagada
    // Por ejemplo, podrías agregar un campo 'pagada' en el modelo Reserva

    res.json({ message: 'Reserva marcada como pagada', reserva });
  } catch (error) {
    console.error('Error al marcar la reserva como pagada:', error);
    res.status(500).json({ error: 'Error al marcar la reserva como pagada' });
  }
};
module.exports = {
  crearReserva,
  obtenerReservasPropias,
};