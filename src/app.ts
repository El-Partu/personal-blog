import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
dotenv.config({path: './.env'})

const app = express()

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

// Middleware to parse JSON bodies
app.use(express.json())

export default app