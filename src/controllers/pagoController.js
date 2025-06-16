const { Preference } = require('mercadopago');
const client = require('../../config/mercadopago'); // Ajustá la ruta si es diferente

const crearPago = async (req, res) => {
  try {
    const preference = new Preference(client);
    const { title, precio } = req.body;
    const result = await preference.create({
      body: {
        items: [
          {
            title: title, // Título del producto
            quantity: 1, // Cantidad del producto
            currency_id: 'ARS', // Moneda en la que se realiza el pago
            unit_price: precio, 
          }
        ],
        back_urls: {
          success: 'https://www.youtube.com',//'http://localhost:3001/pagos/success',
          failure: 'http://localhost:3001/pagos/failure',
          pending: 'https://www.linkedin.com/'//'http://localhost:3001/pagos/pending',
        },
        auto_return: 'approved', // Redirige automáticamente cuando el pago se aprueba
        external_reference: 'pedido_1234', // Para que luego puedas identificar el pago
      }
    });

    res.status(200).json({ init_point: result.init_point }); // URL a la que redirigir al usuario
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    // Parámetros que envía MercadoPago vía GET
    const { 
      payment_id,
      status,
      external_reference,
      merchant_order_id 
    } = req.query;

    if (!payment_id) {
      return res.status(400).json({ error: "Falta el ID del pago" });
    }

    // Opción 1: Verificar estado usando los parámetros de la URL (rápido)
    const paymentStatus = {
      payment_id,
      status,
      external_reference,
      merchant_order_id,
      message: getStatusMessage(status) // Función helper
    };

    // Opción 2: Consultar la API de MercadoPago para más detalles (completo)
    const paymentDetails = await mercadopago.payment.findById(payment_id);
    
    res.status(200).json({
      status: 'success',
      data: {
        quick_check: paymentStatus,
        full_details: paymentDetails.body
      }
    });

  } catch (error) {
    console.error("Error al verificar pago:", error);
    res.status(500).json({ 
      error: "Error al verificar el pago",
      details: error.message 
    });
  }
};

// Función helper para mensajes de estado
function getStatusMessage(status) {
  const statusMessages = {
    'approved': 'Pago aprobado',
    'pending': 'Pago pendiente',
    'rejected': 'Pago rechazado',
    'cancelled': 'Pago cancelado',
    'refunded': 'Pago reembolsado'
  };
  return statusMessages[status] || `Estado desconocido: ${status}`;
}
module.exports = { crearPago, verifyPayment };