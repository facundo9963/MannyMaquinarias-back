// seeders/20240601000000-all-seeds.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

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
          nombre: "Administrador",
          apellido: "Sistema",
          password: "$2b$10$EXAMPLEHASHEDPASSWORD",
          direccion: "Calle Admin 123",
          edad: 30,
          rol_id: roles[0].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          dni: "35123456",
          nombreUsuario: "trabajador1",
          nombre: "Juan",
          apellido: "Perez",
          password: "$2b$10$EXAMPLEHASHEDPASSWORD",
          direccion: "Calle Trabajador 456",
          edad: 28,
          rol_id: roles[1].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          dni: "30123456",
          nombreUsuario: "cliente1",
          nombre: "Maria",
          apellido: "Gomez",
          password: "$2b$10$EXAMPLEHASHEDPASSWORD",
          direccion: "Avenida Cliente 789",
          edad: 35,
          rol_id: roles[2].id,
          createdAt: now,
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
          nombre: "Excavadora Hidráulica",
          marca: "Caterpillar",
          modelo: "320 GC",
          estado: "disponible",
          precio: 2500.0,
          sucursal_id: sucursales[0].id,
          politica_cancelacion_id: politicas[0].id,
          createdAt: now,
          updatedAt: now,
        },
        {
          nombre: "Retroexcavadora",
          marca: "JCB",
          modelo: "3CX",
          estado: "disponible",
          precio: 1800.0,
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
      },
      {
        precio: 5400.0,
        fecha_inicio: new Date(now.getTime() + 3 * oneDay),
        fecha_fin: new Date(now.getTime() + 6 * oneDay),
        fecha_reserva: now,
        maquina_id: maquinas[1].id,
        usuario_id: usuarios[2].id,
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
