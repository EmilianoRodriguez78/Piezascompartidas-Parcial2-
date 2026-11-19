const { existeOr404 } = require('../middleware/errorMiddleware')
const { filtrarPropiedades } = require('../config/esquema')

const crearControladorRelacion = (tipo, { propiedades }, model) => ({
    listar: async (req, res) => {
        res.status(200).json(await model.listar())
    },

    // PUT idempotente: crea la relación o actualiza sus propiedades
    guardar: async (req, res) => {
        const { origen, destino } = req.params
        const relacion = await model.guardar(origen, destino, filtrarPropiedades(req.body, propiedades))
        res.status(200).json(existeOr404(relacion, `No existe el nodo de origen ${origen} o el de destino ${destino} para ${tipo}`))
    },

    eliminar: async (req, res) => {
        const { origen, destino } = req.params
        existeOr404(await model.eliminar(origen, destino), `No existe la relacion ${origen} -[${tipo}]-> ${destino}`)
        res.status(200).json({ tipo, origen, destino })
    }
})

module.exports = crearControladorRelacion
