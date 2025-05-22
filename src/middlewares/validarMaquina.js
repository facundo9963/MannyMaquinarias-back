const validarMaquina = (req, res, next) => {
    const { nombre, modelo, serie } = req.body;
    
    if (!nombre || !modelo || !serie) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    next();
};

module.exports = validarMaquina;