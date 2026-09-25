import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTER SETUP
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const emailTemplates = {
  verifyEmail: (name, verificationUrl) => ({
    subject: "Verify your Pre-Yeah Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Pre-Yeah, ${name}!</h2>
        <p>Thank you for signing up. Please verify your email to continue.</p>
        
        <div style="background: #61dafb; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <a href="${verificationUrl}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
            Verify Email
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          Or copy this link: ${verificationUrl}
        </p>
        
        <p style="color: #666; font-size: 12px;">
          This link expires in 24 hours.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  }),

  resetPassword: (name, resetUrl) => ({
    subject: "Reset Your Pre-Yeah Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        
        <div style="background: #61dafb; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          Or copy this link: ${resetUrl}
        </p>
        
        <p style="color: #666; font-size: 12px;">
          This link expires in 15 minutes.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't request this, please ignore this email. Your password won't change until you click the link and create a new one.
        </p>
      </div>
    `,
  }),

  welcome: (name) => ({
    subject: "Welcome to Pre-Yeah!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Pre-Yeah, ${name}!</h2>
        <p>Your account has been successfully verified. You're all set to start your career journey.</p>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>What's Next?</h3>
          <ul>
            <li>Explore different career roles</li>
            <li>Select your academic branch</li>
            <li>Get AI-generated learning roadmaps</li>
            <li>Take quizzes and track progress</li>
            <li>Chat with your AI learning assistant</li>
          </ul>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/roles" style="color: #61dafb; font-weight: bold;">
            Start Exploring Roles →
          </a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Pre-Yeah Team
        </p>
      </div>
    `,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const sendVerificationEmail = async (email, name, verificationUrl) => {
  try {
    const template = emailTemplates.verifyEmail(name, verificationUrl);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✓ Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
    throw new Error("Failed to send verification email");
  }
};

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const template = emailTemplates.resetPassword(name, resetUrl);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✓ Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
    throw new Error("Failed to send password reset email");
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const template = emailTemplates.welcome(name);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✓ Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email:", error.message);
    throw new Error("Failed to send welcome email");
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
