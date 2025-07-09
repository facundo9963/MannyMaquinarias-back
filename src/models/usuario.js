const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      dni: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      nombreUsuario: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          len: {
            args: [4, 50],
            msg: "El nombre de usuario debe tener entre 4 y 50 caracteres",
          },
        },
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      apellido: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: "El email no puede estar vacío",
          },
          isEmail: {
            msg: "Debe proporcionar un email válido",
          },
          len: {
            args: [6, 100],
            msg: "El email debe tener entre 6 y 100 caracteres",
          },
        },
      },
      eliminado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "La contraseña no puede estar vacía",
          },
          len: {
            args: [6, 100],
            msg: "La contraseña debe tener al menos 6 caracteres",
          },
        },
      },
      direccion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      edad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: {
            msg: "La edad debe ser un número entero",
          },
          min: {
            args: [18],
            msg: "Debe ser mayor de 18 años",
          },
        },
      },
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          isDecimal: {
            msg: "El precio debe ser un número decimal",
          },
        },
      },
    },
    {
      tableName: "usuarios",
      timestamps: true,
      paranoid: true,
    }
  );

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Rol, {
      foreignKey: "rol_id",
      as: "rol",
    });
    Usuario.hasMany(models.Reserva, {
      foreignKey: "usuario_id",
      as: "reservas",
    });
    Usuario.associate = (models) => {
      Usuario.hasOne(models.ListaNegra, {
        foreignKey: "usuario_id",
        as: "listaNegra",
      });
    };
  };

  Usuario.prototype.tienePermiso = async function (permisoRequerido) {
    if (!this.rol) {
      await this.reload({ include: ["rol"] });
    }

    return this.rol.tienePermiso(permisoRequerido);
  };

  return Usuario;
};
