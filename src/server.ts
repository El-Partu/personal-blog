import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT;

const DB_URI = process.env.DB_CONNECTION_STR!.replace(
  "<db_password>",
  process.env.DB_PASSWORD!
);

//Establishing db connection
mongoose
  .connect(DB_URI)
  .then(() => console.log("connected to database successfully"));

const server = app.listen(PORT, () =>
  console.log(`App listening on port ${PORT}`)
);
