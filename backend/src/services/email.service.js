const nodemailer = require("nodemailer");

// Singleton : le transporteur SMTP est créé une seule fois au chargement du module
// et réutilisé pour tous les envois. Évite de recréer une connexion TCP à chaque email.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  // TLS uniquement sur le port 465 (SMTPS), sinon STARTTLS sur 587.
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envoie un email avec le lien de reinitialisation du mot de passe.
 * @param {object} options
 * @param {string} options.to      - Adresse email du destinataire.
 * @param {string} options.resetLink - URL complète contenant le token UUID.
 */
async function sendResetPasswordEmail({ to, resetLink }) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    const error = new Error("Configuration SMTP manquante.");
    error.statusCode = 500;
    throw error;
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || `"Djangou" <${process.env.SMTP_USER}>`,
    to,
    subject: "Réinitialisation de votre mot de passe Djangou",
    // Version texte brut pour les clients mail qui ne supportent pas le HTML.
    text: `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien (valable 1 heure) :\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe Djangou`,
    // Version HTML avec un design simple et lisible.
    html: `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Réinitialisation mot de passe</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0"
                  style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <!-- En-tête -->
                  <tr>
                    <td style="background:#2563eb;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">
                        🔐 Djangou
                      </h1>
                    </td>
                  </tr>
                  <!-- Corps -->
                  <tr>
                    <td style="padding:40px 40px 24px;">
                      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;">Bonjour,</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
                        Vous avez demandé la réinitialisation de votre mot de passe.<br/>
                        Cliquez sur le bouton ci-dessous — ce lien est valable <strong>1 heure</strong>.
                      </p>
                      <div style="text-align:center;margin:0 0 32px;">
                        <a href="${resetLink}"
                          style="display:inline-block;background:#2563eb;color:#ffffff;
                                 font-size:15px;font-weight:600;text-decoration:none;
                                 padding:14px 32px;border-radius:6px;">
                          Réinitialiser le mot de passe
                        </a>
                      </div>
                      <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                      </p>
                      <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;">
                        ${resetLink}
                      </p>
                    </td>
                  </tr>
                  <!-- Pied de page -->
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                        Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.<br/>
                        Votre mot de passe ne sera pas modifié.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Envoie un email d'invitation à une évaluation.
 * @param {string} studentEmail 
 * @param {string} evalTitle 
 * @param {string} evalLink 
 * @param {string} evalDate
 */
async function sendEvaluationInvite(studentEmail, evalTitle, evalLink, evalDate) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Service] 📧 Simulation d'invitation pour ${studentEmail}. SMTP manquant.`);
    return;
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || `"Djangou Évaluations" <${process.env.SMTP_USER}>`,
    to: studentEmail,
    subject: `Convocation à l'évaluation : ${evalTitle}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">Djangou - Convocation Officielle</h2>
                <p>Bonjour,</p>
                <p>Vous avez été convoqué pour participer à l'évaluation en ligne suivante :</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
                    <p style="margin: 0 0 10px 0;"><strong>Matière / Titre :</strong> ${evalTitle}</p>
                    <p style="margin: 0;"><strong>Date d'ouverture :</strong> ${evalDate || "Immédiat"}</p>
                </div>
                <p>Pour rejoindre la salle d'attente (avec votre lien d'accès unique), veuillez cliquer sur le bouton ci-dessous :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${evalLink}" style="background-color: #3498db; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Accéder à la Salle d'Évaluation
                    </a>
                </div>
                <p><em>Attention : Ce lien vous est strictement personnel. Votre accès est sécurisé (valide uniquement pour <strong>${studentEmail}</strong>).</em></p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="font-size: 11px; color: #7f8c8d; text-align: center;">Système anti-triche Djangou activé durant l'épreuve.</p>
            </div>
        `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] 📧 Invitation envoyée à ${studentEmail} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error(`[Email Service] ❌ Erreur d'envoi SMTP à ${studentEmail} :`, error);
  }
}

module.exports = { sendResetPasswordEmail, sendEvaluationInvite };
