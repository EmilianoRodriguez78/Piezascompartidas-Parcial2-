const express = require('express')
const router = express.Router()
const consultas = require('../controllers/consultasController')

router.get('/resumen', consultas.resumen)

// Analizar impacto
router.get('/impacto/proveedor/:codigo', consultas.impactoProveedor)
router.get('/impacto/pieza/:codigo', consultas.impactoPieza)

// Buscar reutilización
router.get('/reutilizacion/:codigo', consultas.reutilizacion)
router.get('/piezas-compartidas', consultas.piezasCompartidas)

// Detectar riesgo
router.get('/riesgo/proveedor-unico', consultas.piezasProveedorUnico)
router.get('/riesgo/modelo-unico', consultas.piezasModeloUnico)

module.exports = router
