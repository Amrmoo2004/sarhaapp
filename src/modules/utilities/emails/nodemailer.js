import nodemailer from "nodemailer";

export async function sendemails({
    from = process.env.app_email,
    to = "",
    cc = "",
    bcc = "",
    text = "",
    html = "",    
    subject = "modelstar",
    attachments = []
} = {}) {
    
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.app_email,
            pass: process.env.app_password,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"modelstar" <${process.env.app_email}>`,
            to, cc, bcc, text, html, subject, attachments
        });
      
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}