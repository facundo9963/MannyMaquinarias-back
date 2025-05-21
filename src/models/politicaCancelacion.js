const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PoliticaCancelacion = sequelize.define(
    "PoliticaCancelacion",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      porcentajeRembolso: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: "El porcentaje de reembolso debe ser un número decimal",
          },
          min: {
            args: [0],
            msg: "El porcentaje no puede ser negativo",
          },
          max: {
            args: [100],
            msg: "El porcentaje no puede ser mayor a 100",
          },
        },
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "La descripción no puede estar vacía",
          },
        },
      },
    },
    {
      tableName: "politicas_cancelacion",
      timestamps: true,
    }
  );

  PoliticaCancelacion.associate = (models) => {
    PoliticaCancelacion.hasMany(models.Maquina, {
      foreignKey: "politica_cancelacion_id",
      as: "maquinas",
    });
  };

  return PoliticaCancelacion;
};
