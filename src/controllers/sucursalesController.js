const { Sucursal } = require("../../db");

const getSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll();
    res.status(200).json(sucursales);
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    res.status(500).json({ message: "Error al obtener sucursales" });
  }
};

module.exports = {
  getSucursales,
};
