const express = require('express')

const crearRutasNodos = (controlador) => {
    const router = express.Router()

    router.get('/', controlador.listar)
    router.post('/', controlador.crear)

    router.get('/:codigo', controlador.obtener)
    router.put('/:codigo', controlador.actualizar)
    router.delete('/:codigo', controlador.eliminar)

    return router
}

module.exports = crearRutasNodos
