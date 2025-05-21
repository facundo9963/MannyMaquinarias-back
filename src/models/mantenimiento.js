const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Mantenimiento = sequelize.define(
    "Mantenimiento",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "El nombre no puede estar vacío",
          },
        },
      },
      detalle: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "El detalle no puede estar vacío",
          },
        },
      },
      fechaInicio: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: "La fecha de inicio debe ser una fecha válida",
          },
        },
      },
      fechaFin: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: {
            msg: "La fecha de fin debe ser una fecha válida",
          },
        },
      },
    },
    {
      tableName: "mantenimientos",
      timestamps: true,
    }
  );

  Mantenimiento.associate = (models) => {
    Mantenimiento.belongsTo(models.Maquina, {
      foreignKey: "maquina_id",
      as: "maquina",
    });
  };

  return Mantenimiento;
};
