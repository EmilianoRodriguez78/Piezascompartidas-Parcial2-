const express = require('express')

const crearRutasRelacion = (controlador) => {
    const router = express.Router()

    router.get('/', controlador.listar)
    router.put('/:origen/:destino', controlador.guardar)
    router.delete('/:origen/:destino', controlador.eliminar)

    return router
}

module.exports = crearRutasRelacion
