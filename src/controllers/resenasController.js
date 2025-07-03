const { Resena, Reserva, Maquina, Usuario, ListaNegra } = require("../../db");
const { Op, or, where, literal } = require("sequelize");
const bcrypt = require("bcrypt");
const db = require("../../db");


const crearResena = async (req, res) => {
    const usuarioLogueado = req.usuarioLogueado;
    const { reserva_id, comentario, puntuacion } = req.body;    
    if (!reserva_id || !puntuacion) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }    
    // Verificar si la reserva existe y pertenece al usuario
    const reserva = await db.Reserva.findOne({
        where: {
        id: reserva_id,
        usuario_id: usuarioLogueado.id,
        resena_id: null, // Asegurarse de que no tenga una reseña asociada
        eliminado: false,
        },
    });    
    if (!reserva) {
        return res.status(404).json({ error: "Reserva no encontrada, no pertenece al usuario o ya tiene reseña" });
    }
    if (reserva.resena_id) {
        return res.status(400).json({ error: "La reserva ya tiene una reseña" });
    }    
    // Verificar si el usuario está en la lista negra
    const usuarioEnListaNegra = await ListaNegra.findOne({
        where: { usuario_id: usuarioLogueado.id },
    });
    
    if (usuarioEnListaNegra) {
        return res.status(403).json({
        error: "El usuario está en la lista negra y no puede dejar reseñas",
        });
    }
    
    try {
        const nuevaResena = await Resena.create({
        comentario,
        puntuacion,
        });

        const reservaActualizada = await Reserva.findByPk(reserva_id)
        reservaActualizada.resena_id = await nuevaResena.id;

        await reservaActualizada.save();

        if (!reservaActualizada) {
            return res.status(404).json({ error: "No se pudo actualizar la reserva con la reseña" });
        }
    
        return res.status(201).json(nuevaResena);
    } catch (error) {
        console.error("Error al crear la reseña:", error);
        return res.status(500).json({ error: "Error al crear la reseña" });
    }
    }

const obtenerResenasPorMaquina = async (req, res) => {
    const maquina_id  = req.body.maquina_id || req.query.maquina_id;
    if (!maquina_id) {
        return res.status(400).json({ error: "Falta el ID de la máquina" });
    }
    
    try {
        const resenas = await db.Resena.findAll({
            include: {
                model: db.Reserva,
                as: "reserva",
                attributes: ["id", "fecha_inicio", "fecha_fin"],
                where: {
                    maquina_id: maquina_id
                },
                include: {
                    model: db.Maquina,
                    as: "maquina",
                    attributes: ["id", "nombre"],
                }
            }
        });
        
        return res.status(200).json(resenas);
    } catch (error) {
        console.error("Error al obtener reseñas:", error);
        return res.status(500).json({ error: "Error al obtener reseñas" });
    }
};

const obtenerResenasPorUsuario = async (req, res) => {
    const usuarioLogueado = req.usuarioLogueado;
    try {
        const resenas = await db.Resena.findAll({
            include: {
                model: db.Reserva,
                as: "reserva",
                attributes: ["id", "fecha_inicio", "fecha_fin"],
                where: {
                    usuario_id: usuarioLogueado.id,
                    eliminado: false,
                    pagada: true
                },
                include: {
                    model: db.Maquina,
                    as: "maquina",
                    attributes: ["id", "nombre"],
                }
            }
        });
        if (resenas.length === 0) {
            return res.status(404).json({ message: "No hay reseñas registradas para este usuario" });
        }
        
        return res.status(200).json(resenas);
    } catch (error) {
        console.error("Error al obtener reseñas del usuario:", error);
        return res.status(500).json({ error: "Error al obtener reseñas del usuario" });
    }
}

const obtenerTodasResenasPorUsuario = async (req, res) => {
    const usuario_id = req.body.usuario_id || req.query.usuario_id;
    try {
        if (!usuario_id){
            return res.status(400).json({ error: "Falta el ID del usuario" });
        }
         const resenas = await db.Resena.findAll({
            include: {
                model: db.Reserva,
                as: "reserva",
                attributes: ["id", "fecha_inicio", "fecha_fin"],
                where: {
                    usuario_id: usuario_id,
                    eliminado: false,
                    pagada: true
                },
                include: {
                    model: db.Maquina,
                    as: "maquina",
                    attributes: ["id", "nombre"],
                }
            }
        });
        if (resenas.length === 0) {
            return res.status(404).json({ message: "No hay reseñas registradas para este usuario" });
        }
        
        return res.status(200).json(resenas);
    } catch (error) {
        console.error("Error al obtener todas las reseñas:", error);
        return res.status(500).json({ error: "Error al obtener todas las reseñas" });
    }
}


module.exports = {
    crearResena,
    obtenerResenasPorMaquina,
    obtenerResenasPorUsuario,
    obtenerTodasResenasPorUsuario
}