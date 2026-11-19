const { HttpError, existeOr404 } = require('../middleware/errorMiddleware')
const { filtrarPropiedades } = require('../config/esquema')

// Controlador CRUD genérico: valida la petición y delega en el modelo.
// Express 5 envía automáticamente al errorHandler los errores de funciones async.
const crearControladorNodos = ({ etiqueta, propiedades }, model) => {
    const noExiste = (codigo) => `No existe ${etiqueta} con codigo ${codigo}`

    return {
        listar: async (req, res) => {
            res.status(200).json(await model.listar())
        },

        obtener: async (req, res) => {
            const { codigo } = req.params
            res.status(200).json(existeOr404(await model.obtener(codigo), noExiste(codigo)))
        },

        crear: async (req, res) => {
            // El codigo debe ser texto: en la URL (/api/piezas/:codigo) siempre llega como texto
            const codigo = typeof req.body?.codigo === 'string' ? req.body.codigo.trim() : ''
            const datos = filtrarPropiedades(req.body, propiedades)
            if (!codigo || !datos.nombre) {
                throw new HttpError(400, 'Faltan datos: codigo y nombre son obligatorios (codigo como texto)')
            }
            res.status(201).json(await model.crear({ codigo, ...datos }))
        },

        // El codigo es el identificador, por eso no se puede modificar
        actualizar: async (req, res) => {
            const { codigo } = req.params
            const cambios = filtrarPropiedades(req.body, propiedades)
            if (Object.keys(cambios).length === 0) {
                throw new HttpError(400, `Nada que actualizar. Propiedades permitidas: ${propiedades.join(', ')}`)
            }
            res.status(200).json(existeOr404(await model.actualizar(codigo, cambios), noExiste(codigo)))
        },

        eliminar: async (req, res) => {
            const { codigo } = req.params
            existeOr404(await model.eliminar(codigo), noExiste(codigo))
            res.status(200).json({ codigo })
        }
    }
}

module.exports = crearControladorNodos
