import app from "./app.js";
const PORT = 3000
const server = app.listen(PORT, ()=> console.log(`App listening on port ${PORT}`))