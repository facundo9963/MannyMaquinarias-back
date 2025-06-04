const { PoliticaCancelacion } = require("../../db");

const getPoliticasCancelacion = async (req, res) => {
  try {
    const politicas = await PoliticaCancelacion.findAll();
    res.status(200).json(politicas);
  } catch (error) {
    console.error("Error al obtener políticas de cancelación:", error);
    res
      .status(500)
      .json({ message: "Error al obtener políticas de cancelación." });
  }
};

module.exports = {
  getPoliticasCancelacion,
};
