const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ListaNegra = sequelize.define(
    "ListaNegra",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "lista_negra",
      timestamps: true,
    }
  );

  ListaNegra.associate = (models) => {
    ListaNegra.belongsTo(models.Usuario, {
      foreignKey: "usuario_id",
      as: "usuario",
    });
  };

  return ListaNegra;
};
