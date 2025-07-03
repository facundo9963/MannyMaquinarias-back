const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Resena = sequelize.define(
    "Resena",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      puntuacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
    },
    {
      tableName: "resenas",
      timestamps: true,
    }
  );

  Resena.associate = (models) => {
    Resena.hasOne(models.Reserva, {
      foreignKey: "resena_id",
      as: "reserva"
    });
  };


  return Resena;
};
