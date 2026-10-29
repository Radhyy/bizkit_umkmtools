import nodemailer from 'nodemailer';

export async function sendOTPEmail(toEmail: string, otpCode: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Bizkit" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Kode Verifikasi OTP Anda - Bizkit',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0047FF; text-align: center;">Bizkit</h2>
        <p style="font-size: 16px; color: #333;">Halo!</p>
        <p style="font-size: 16px; color: #333;">Terima kasih telah mendaftar. Untuk memverifikasi alamat email Anda, silakan gunakan kode OTP berikut:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0047FF; background-color: #f4f8fb; padding: 10px 20px; border-radius: 8px;">${otpCode}</span>
        </div>
        <p style="font-size: 14px; color: #666;">Kode ini hanya berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Jika Anda tidak merasa mendaftar di Bizkit, abaikan email ini.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendResetPasswordEmail(toEmail: string, otpCode: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Bizkit" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Password Anda - Bizkit',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0047FF; text-align: center;">Bizkit</h2>
        <p style="font-size: 16px; color: #333;">Halo!</p>
        <p style="font-size: 16px; color: #333;">Kami menerima permintaan untuk mereset password akun Anda. Silakan gunakan kode OTP berikut untuk membuat password baru:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0047FF; background-color: #f4f8fb; padding: 10px 20px; border-radius: 8px;">${otpCode}</span>
        </div>
        <p style="font-size: 14px; color: #666;">Kode ini hanya berlaku selama 10 menit. Jika Anda tidak merasa meminta reset password, abaikan email ini dan pastikan akun Anda aman.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">&copy; Bizkit. Semua Hak Dilindungi.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
