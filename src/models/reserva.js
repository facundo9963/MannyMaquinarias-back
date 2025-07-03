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
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: {
            msg: "Debe proporcionar una fecha de inicio válida",
          },
          isAfterCurrentDate(value) {
            const hoy = new Date().toISOString().split("T")[0];
            if (value <= hoy) {
              throw new Error("La fecha de inicio debe ser futura");
            }
          },
        },
      },
      fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: {
            msg: "Debe proporcionar una fecha de fin válida",
          },
          isAfterStartDate(value) {
            if (value <= this.fecha_inicio) {
              throw new Error(
                "La fecha fin debe ser posterior a la fecha inicio"
              );
            }
          },
        },
      },
      fecha_reserva: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: {
            msg: "Debe ser una fecha válida",
          },
        },
      },
      pagada: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        validate: {
          isBoolean: {
            msg: "El campo 'pagada' debe ser un valor booleano",
          },
        },
      },
      eliminado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,

      },
    },
    {
      tableName: "reservas",
      timestamps: false,
      indexes: [{ fields: ["fecha_inicio"] }, { fields: ["fecha_fin"] }],
    }
  );

  Reserva.associate = (models) => {
    Reserva.belongsTo(models.Maquina, {
      foreignKey: {
        name: "maquina_id",
        allowNull: false,
      },
      as: "maquina",
    });

    Reserva.belongsTo(models.Resena, {
      foreignKey: {
        name: "resena_id",
        allowNull: true,
      },
    as: "resena",
    });

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
