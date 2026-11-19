const consultas = require('../models/consultasModel')

// Todas las consultas responden igual: ejecutan y devuelven el resultado en JSON
const responder = (consulta) => async (req, res) => {
    res.status(200).json(await consulta(req.params.codigo))
}

module.exports = {
    resumen: responder(consultas.resumen),
    impactoProveedor: responder(consultas.impactoProveedor),
    impactoPieza: responder(consultas.impactoPieza),
    reutilizacion: responder(consultas.reutilizacion),
    piezasCompartidas: responder(consultas.piezasCompartidas),
    piezasProveedorUnico: responder(consultas.piezasProveedorUnico),
    piezasModeloUnico: responder(consultas.piezasModeloUnico)
}
