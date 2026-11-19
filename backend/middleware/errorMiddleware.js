const CONSTRAINT_VIOLADA = 'Neo.ClientError.Schema.ConstraintValidationFailed'

// Significado de cada código de error HTTP que responde la API
const SIGNIFICADOS = {
    400: 'Solicitud incorrecta: los datos enviados no son válidos',
    404: 'No encontrado: el registro o la ruta no existe',
    409: 'Conflicto: la operación choca con datos que ya existen',
    500: 'Error interno del servidor'
}

// Error con código HTTP, para que errorHandler sepa qué status responder
class HttpError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

// Devuelve el valor o lanza 404 si no existe
const existeOr404 = (valor, mensaje) => {
    if (!valor) throw new HttpError(404, mensaje)
    return valor
}

const rutaNoEncontrada = (req, res, next) => {
    next(new HttpError(404, `No existe la ruta ${req.method} ${req.originalUrl}`))
}

const errorHandler = (err, req, res, next) => {
    let status = err.status || 500
    let message = err.message

    if (err.code === CONSTRAINT_VIOLADA) {
        status = 409
        message = 'Ya existe un nodo con ese codigo'
    }

    // express.json() no pudo leer el body
    if (err.type === 'entity.parse.failed') {
        message = 'El cuerpo de la petición no es un JSON válido'
    }

    if (status === 500) console.error(err)

    res.status(status).json({
        status,
        significado: SIGNIFICADOS[status],
        message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    })
}

module.exports = { HttpError, existeOr404, rutaNoEncontrada, errorHandler }
