const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mannymaquinariasNotificaciones@gmail.com",
    pass: "epfl yvlg cvpz uofd",
  },
});

const enviarEmail = async (to, subject, text) => {
  const mailOptions = {
    from: "mannymaquinariasNotificaciones@gmail.com",
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { enviarEmail };
