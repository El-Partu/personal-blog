class appError extends Error{
    constructor(message, statusCode){
        this.message = message
        this.statusCode = statusCode
        this.isOperational = true
        this.stackTrace = Error.captureStackTrace(this.constructor)
    }
}

export default appError