// seeders/20240601000000-all-seeds.js
"use strict";
const bcrypt = require("bcrypt");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const hashedPassword = await bcrypt.hash("contra", 10);
    // 1. Crear Roles primero
    const roles = await queryInterface.bulkInsert(
      "roles",
      [
        {
          nombre: "admin",
          createdAt: now,
          updatedAt: now,
        },
        {
          nombre: "trabajador",
          createdAt: now,
          updatedAt: now,
        },
        {
          nombre: "cliente",
          createdAt: now,
          updatedAt: now,
        },
        {
          nombre: "visitante",
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: true }
    );

    // 2. Crear Permisos
    const permisos = await queryInterface.bulkInsert(
      "permisos",
      [
        {
          clave: "system.admin",
          nombre: "Administrador del Sistema",
          descripcion: "Acceso total al sistema",
          createdAt: now,
          updatedAt: now,
        },
        {
          clave: "maquinas.view",
          nombre: "Ver Máquinas",
          descripcion: "Puede ver el listado de máquinas",
          createdAt: now,
          updatedAt: now,
        },
        {
          clave: "maquinas.create",
          nombre: "Crear Máquinas",
          descripcion: "Puede crear nuevas máquinas",
          createdAt: now,
          updatedAt: now,
        },
        {
          clave: "maquinas.edit",
          nombre: "Editar Máquinas",
          descripcion: "Puede editar máquinas existentes",
          createdAt: now,
          updatedAt: now,
        },
        {
          clave: "maquinas.delete",
          nombre: "Eliminar Máquinas",
          descripcion: "Puede eliminar máquinas",
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: true }
    );

    // 3. Asignar Permisos a Roles
    await queryInterface.bulkInsert("rol_permiso", [
      {
        rol_id: roles[0].id,
        permiso_id: permisos[0].id,
        createdAt: now,
        updatedAt: now,
      },
      {
        rol_id: roles[1].id,
        permiso_id: permisos[1].id,
        createdAt: now,
        updatedAt: now,
      },
      {
        rol_id: roles[1].id,
        permiso_id: permisos[2].id,
        createdAt: now,
        updatedAt: now,
      },
      {
        rol_id: roles[1].id,
        permiso_id: permisos[3].id,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 4. Crear Sucursales
    const sucursales = await queryInterface.bulkInsert(
      "sucursales",
      [
        {
          localidad: "Buenos Aires",
          telefono: "+541112345678",
          direccion: "Av. Corrientes 1234",
          createdAt: now,
          updatedAt: now,
        },
        {
          localidad: "Córdoba",
          telefono: "+543514567890",
          direccion: "Av. Colón 567",
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: true }
    );

    // 5. Crear Políticas de Cancelación
    const politicas = await queryInterface.bulkInsert(
      "politicas_cancelacion",
      [
        {
          porcentajeRembolso: 100,
          descripcion:
            "Reembolso completo si se cancela con 48 horas de anticipación",
          createdAt: now,
          updatedAt: now,
        },
        {
          porcentajeRembolso: 50,
          descripcion:
            "Reembolso del 50% si se cancela con 24 horas de anticipación",
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: true }
    );

    // 6. Crear Usuarios
    const usuarios = await queryInterface.bulkInsert(
      "usuarios",
      [
        {
          dni: "40123456",
          nombreUsuario: "admin",
          email: "admin@gmail.com",
          nombre: "Administrador",
          apellido: "Sistema",
          password: hashedPassword,
          direccion: "Calle Admin 123",
          edad: 30,
          monto: 0.0,
          rol_id: roles[0].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          dni: "35123456",
          nombreUsuario: "trabajador1",
          email: "Juan@gmail.com",
          nombre: "Juan",
          apellido: "Perez",
          password: hashedPassword,
          direccion: "Calle Trabajador 456",
          edad: 28,
          monto: 0.0,
          rol_id: roles[1].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          dni: "30123456",
          nombreUsuario: "cliente1",
          email: "Maria@gmail.com",
          nombre: "Maria",
          apellido: "Gomez",
          password: hashedPassword,
          direccion: "Avenida Cliente 789",
          edad: 35,
          monto: 0.0,
          rol_id: roles[2].id,
          createdAt: new Date(new Date(now).setMonth(new Date(now).getMonth() - 1)),
          updatedAt: now,
        },
        {
          dni: "11111111",
          nombreUsuario: "cliente2",
          email: "Cande@gmail.com",
          nombre: "Candela",
          apellido: "Silva",
          password: hashedPassword,
          direccion: "Avenida Cliente 789",
          edad: 35,
          monto: 0.0,
          rol_id: roles[2].id,
          createdAt: new Date(new Date(now).setMonth(new Date(now).getMonth() - 2)),
          updatedAt: now,
        },
        {
          dni: "22222222",
          nombreUsuario: "cliente3",
          email: "melany@gmail.com",
          nombre: "melany",
          apellido: "Silva",
          password: hashedPassword,
          direccion: "Avenida Cliente 789",
          edad: 22,
          monto: 0.0,
          rol_id: roles[2].id,
          createdAt: new Date(new Date(now).setMonth(new Date(now).getMonth() - 2)),
          updatedAt: now,
        },
      ],
      { returning: true }
    );

    // 7. Crear Máquinas
    const maquinas = await queryInterface.bulkInsert(
      "maquinas",
      [
        {
          numeroSerie: "2222",
          nombre: "Excavadora Hidráulica",
          marca: "Caterpillar",
          modelo: "320 GC",
          categoria: "industria",
          estado: "disponible",
          precio: 2500.0,
          imageUrl:
            "https://eymdecoleccion.com/wp-content/uploads/2024/07/EMQ5569-CAT-excavadora-320.jpg",
          sucursal_id: sucursales[1].id,
          politica_cancelacion_id: politicas[1].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          numeroSerie: "3333",
          nombre: "Retroexcavadora",
          marca: "JCB",
          modelo: "3CX",
          categoria: "industria",
          estado: "disponible",
          precio: 1800.0,
          imageUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrnYRTKDxSfb8cEmY3ekM9SjRsiOt2Lt6eiA&s",
          sucursal_id: sucursales[0].id,
          politica_cancelacion_id: politicas[1].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          numeroSerie: "4444",
          nombre: "Minicargadora",
          marca: "Bobcat",
          modelo: "S650",
          categoria: "construccion",
          estado: "disponible",
          precio: 1200.0,
          imageUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrnYRTKDxSfb8cEmY3ekM9SjRsiOt2Lt6eiA&s",
          sucursal_id: sucursales[0].id,
          politica_cancelacion_id: politicas[1].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          numeroSerie: "5555",
          nombre: "Martillo Hidráulico",
          marca: "Atlas Copco",
          modelo: "HB 2500",
          categoria: "demolicion",
          estado: "en mantenimiento",
          precio: 800.0,
          imageUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrnYRTKDxSfb8cEmY3ekM9SjRsiOt2Lt6eiA&s",
          sucursal_id: sucursales[0].id,
          politica_cancelacion_id: politicas[1].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          numeroSerie: "6666",
          nombre: "Plataforma Elevadora",
          marca: "Genie",
          modelo: "GS-1930",
          categoria: "elevacion",
          estado: "disponible",
          precio: 950.0,
          imageUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQETWTUOD-8oDCSfoHy5FC-XLJfqT2vra3FHA&s",
          sucursal_id: sucursales[0].id,
          politica_cancelacion_id: politicas[1].id,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: true }
    );

    // 8. Crear Reservas
    const oneDay = 24 * 60 * 60 * 1000; // milisegundos en un día

    await queryInterface.bulkInsert("reservas", [
      {
        precio: 7500.0,
        fecha_inicio: new Date(now.getTime() + 2 * oneDay),
        fecha_fin: new Date(now.getTime() + 5 * oneDay),
        fecha_reserva: now,
        maquina_id: maquinas[0].id,
        usuario_id: usuarios[2].id,
        pagada: true,
      },
      {
        precio: 5400.0,
        fecha_inicio: new Date(now.getTime() + 3 * oneDay),
        fecha_fin: new Date(now.getTime() + 6 * oneDay),
        fecha_reserva: now,
        maquina_id: maquinas[1].id,
        usuario_id: usuarios[2].id,
        pagada: true,
      },
      {
        precio: 7500.0,
        fecha_inicio: new Date(now.getTime() + 1 * oneDay),
        fecha_fin: new Date(now.getTime() + 5 * oneDay),
        fecha_reserva: new Date(now.getTime() - 5 * oneDay),
        maquina_id: maquinas[4].id,
        usuario_id: usuarios[2].id,
        pagada: true,
      },
      {
        precio: 5400.0,
        fecha_inicio: new Date(now.getTime() + 4 * oneDay),
        fecha_fin: new Date(now.getTime() + 6 * oneDay),
        fecha_reserva: new Date(now.getTime() - 2 * oneDay),
        maquina_id: maquinas[3].id,
        usuario_id: usuarios[2].id,
        pagada: true,
      },
    ]);

    // 9. Crear Mantenimientos
    await queryInterface.bulkInsert("mantenimientos", [
      {
        nombre: "Cambio de aceite",
        detalle: "Cambio de aceite y filtros según programa de mantenimiento",
        fechaInicio: now,
        fechaFin: new Date(now.getTime() + 2 * oneDay),
        maquina_id: maquinas[0].id,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("mantenimientos", null, {});
    await queryInterface.bulkDelete("reservas", null, {});
    await queryInterface.bulkDelete("maquinas", null, {});
    await queryInterface.bulkDelete("usuarios", null, {});
    await queryInterface.bulkDelete("politicas_cancelacion", null, {});
    await queryInterface.bulkDelete("sucursales", null, {});
    await queryInterface.bulkDelete("rol_permiso", null, {});
    await queryInterface.bulkDelete("permisos", null, {});
    await queryInterface.bulkDelete("roles", null, {});
  },
};
