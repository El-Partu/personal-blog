import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

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

  
}
