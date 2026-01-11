import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import handlebars from "handlebars";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type User = {
  name: string;
  email: string;
};

class EmailService {
  to: string;
  from: string;
  firstName: string | undefined;
  url: string;

  constructor(user: User, url: string) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Your Company <${process.env.SEND_GRID_USERNAME}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // SendGrid transporter for production
      return nodemailer.createTransport({
        host: process.env.SEND_GRID_HOST,
        port: Number(process.env.SEND_GRID_PORT),
        auth: {
          user: process.env.SEND_GRID_USERNAME,
          pass: process.env.SEND_GRID_PASSWORD,
        },
      });
    }

    // Default transporter for development
    return nodemailer.createTransport(
      MailtrapTransport({
        token: process.env.MAILTRAP_TOKEN!,
      })
    );
  }

  async sendVerificationEmail() {
    // 1) Render HTML based on a template
    const source = fs.readFileSync(
      path.join(__dirname, "../views/emailVerificationTemplate.hbs"),
      "utf-8"
    );
    const template = handlebars.compile(source);
    const html = template({
      firstName: this.firstName,
      url: this.url,
      subject: "Email Verification",
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: "Email Verification",
      html,
    };
    
    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
}
