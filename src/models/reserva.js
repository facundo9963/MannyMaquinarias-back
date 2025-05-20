// models/reserva.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Reserva = sequelize.define(
    "Reserva",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: "El precio debe ser un número decimal",
          },
          min: {
            args: [0],
            msg: "El precio no puede ser negativo",
          },
        },
      },
      fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: "Debe proporcionar una fecha de inicio válida",
          },
          isAfterCurrentDate(value) {
            if (new Date(value) < new Date()) {
              throw new Error("La fecha de inicio debe ser futura");
            }
          },
        },
      },
      fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: "Debe proporcionar una fecha de fin válida",
          },
          isAfterStartDate(value) {
            if (new Date(value) <= new Date(this.fecha_inicio)) {
              throw new Error(
                "La fecha fin debe ser posterior a la fecha inicio"
              );
            }
          },
        },
      },
      fecha_reserva: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: true,
        },
      },
    },
    {
      tableName: "reservas",
      timestamps: false, // Ya tenemos fecha_reserva como equivalente a createdAt
      paranoid: true, // Para borrado lógico
      indexes: [
        {
          fields: ["fecha_inicio"], // Índice para búsquedas por fecha
        },
        {
          fields: ["fecha_fin"],
        },
      ],
    }
  );

  // Relación con Máquina (asumiendo que una reserva es para una máquina)
  Reserva.associate = (models) => {
    Reserva.belongsTo(models.Maquina, {
      foreignKey: {
        name: "maquina_id",
        allowNull: false,
      },
      as: "maquina",
    });

    // Si tienes usuarios/clientes que hacen reservas:
    Reserva.belongsTo(models.Usuario, {
      foreignKey: {
        name: "usuario_id",
        allowNull: false,
      },
      as: "usuario",
    });
  };

  return Reserva;
};
