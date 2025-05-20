const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Maquina = sequelize.define(
    "Maquina",
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
          len: {
            args: [2, 100],
            msg: "El nombre debe tener entre 2 y 100 caracteres",
          },
        },
      },
      marca: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "La marca no puede estar vacía",
          },
        },
      },
      modelo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "El modelo no puede estar vacío",
          },
        },
      },
      estado: {
        type: DataTypes.ENUM(
          "disponible",
          "entregado",
          "en mantenimiento",
          "checkeo"
        ),
        allowNull: false,
        defaultValue: "disponible",
        validate: {
          isIn: {
            args: [["disponible", "entregado", "en mantenimiento", "checkeo"]],
            msg: "Estado no válido",
          },
        },
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
    },
    {
      tableName: "maquinas",
      timestamps: true,
      paranoid: true, // habilita borrado lógico (crea deletedAt)
      indexes: [
        {
          fields: ["estado"], // índice para búsquedas por estado
        },
        {
          fields: ["marca"], // índice para búsquedas por marca
        },
      ],
    }
  );

  Maquina.associate = (models) => {
    Maquina.hasMany(models.Reserva, {
      foreignKey: "maquina_id",
      as: "reservas",
    });
  };

  return Maquina;
};
