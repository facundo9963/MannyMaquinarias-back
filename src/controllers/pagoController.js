const { Preference} = require('mercadopago');
const client = require('../../config/mercadopago'); // Ajustá la ruta si es diferente
const { Reserva } = require('../../db'); // Asegúrate de que la ruta sea correcta
const fetch = require('node-fetch'); // Asegúrate de tener instalado node-fetch si usas Node.js

const crearPago = async (req, res) => {
  try {
    usuarioLogueado = req.usuarioLogueado;
    if (!usuarioLogueado) {
      return res.status(403).json({ error: "No autorizado." });
    }
    const preference = new Preference(client);
    const { title, precio, idReserva } = req.body;
    const precioNum = parseFloat(precio);
    const result = await preference.create({
      body: {
        items: [
          {
            title: title, // Título del producto
            quantity: 1, // Cantidad del producto
            currency_id: 'ARS', // Moneda en la que se realiza el pago
            unit_price: precioNum, 
          }
        ],
        back_urls: {
          success: 'https://www.youtube.com',//'http://localhost:3001/pagos/success',
          failure: 'http://localhost:3001/pagos/failure',
          pending: 'https://www.linkedin.com/'//'http://localhost:3001/pagos/pending',
        },
        payer: {
          email: usuarioLogueado.email,
          identification: {
            type: 'DNI', // o CPF si es en Brasil
            number: usuarioLogueado.dni // Número de identificación del usuario
          }
        },
        auto_return: 'approved', // Redirige automáticamente cuando el pago se aprueba
        external_reference: idReserva, // Para que luego puedas identificar el pago
      }
    });

    res.status(200).json({ init_point: result.init_point, usuarioLogueado: usuarioLogueado }); // URL a la que redirigir al usuario
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
};

async function getPayment(paymentId) {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta:', errorText);
      throw new Error(`Error Mercado Pago: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener el pago:', error);
    throw error;
  }
}


function marcarReservaComoPagada(paymentId ) {
  try {
    getPayment(paymentId) // Llamada a la función para obtener el pago
      .then(paymentData => {
        if (paymentData.status === 'approved') {
          console.log(`✅ Pago aprobado por $${paymentData.transaction_amount}`);
          const idReserva = paymentData.external_reference;
          Reserva.findByPk(idReserva)
          .then(reserva => {
            if (reserva) {
              if (reserva.pagada) {
                console.log(`⚠️ La reserva ${reserva.id} ya está marcada como pagada.`);
                return;              
              }
              reserva.pagada = true;
              reserva.save();
              console.log(`✅ Reserva ${reserva.id} marcada como pagada.`);
            } else {
              console.log(`⚠️ No se encontró una reserva pendiente para el id: ${idReserva}`);
              return;
            }
          });
        }
        else {
          console.log(`⚠️ Estado del pago: ${paymentData.status}`);
          return;
        }
      })
      .catch(error => {
        console.error('❌ Error al obtener el pago:', error);
        throw error;
      });
  } catch (error) {
    console.error('❌ Error al marcar la reserva como pagada:', error);
  }
    

}
const pagarReserva = async (req, res) => {
  try {
    const notificacion = req.body; // Mercado Pago envía los datos del pago aquí
    //console.log('🔔 Webhook recibido:', notificacion);
    if (notificacion.type){
      if (notificacion.type === 'payment' && notificacion.data && notificacion.data.id) {
        const paymentId = notificacion.data.id;
        marcarReservaComoPagada(paymentId)
      }       
    res.sendStatus(200); // Mercado Pago espera esto
    }
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.sendStatus(500);
  }
};

module.exports = { crearPago, pagarReserva};