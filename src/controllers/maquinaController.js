const {
  Maquina,
  Reserva,
  Mantenimiento,
  Sucursal,
  PoliticaCancelacion,
} = require("../../db");

const listarMaquinas = async (req, res) => {
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
};

module.exports = {
  listarMaquinas,
};
