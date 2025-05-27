const {
  Maquina,
  Reserva,
  Mantenimiento,
  Sucursal,
  PoliticaCancelacion,
} = require("../../db");

const  listarMaquinas = async (req, res) => {
    try {
      const maquinas = await Maquina.findAll({
        include: [
          { model: Reserva, as: "reservas" },
          { model: Mantenimiento, as: "mantenimientos" },
          { model: Sucursal, as: "sucursal" },
          { model: PoliticaCancelacion, as: "politicaCancelacion" },
        ],
      });

      res.status(200).json(maquinas);
    } catch (error) {
      console.error("Error al listar máquinas con relaciones:", error);
      res.status(500).json({ message: "Error al obtener las máquinas" });
    }
}

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
        
        await maquina.destroy();
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {listarMaquinas, agregarMaquina, eliminarMaquina};
