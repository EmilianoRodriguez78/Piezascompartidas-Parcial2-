// Deja la base de datos en el estado inicial para las pruebas:
// BORRA TODO el grafo, crea las restricciones de unicidad y carga los datos de datos.js.
// Uso: npm run seed
require('dotenv').config({ quiet: true })
const { conectarDB, ejecutar, cerrarDB } = require('./db')
const { ENTIDADES, RELACIONES } = require('./esquema')
const { crearNodosModel, crearRestricciones } = require('../models/nodosModel')
const crearRelacionModel = require('../models/relacionesModel')
const { resumen } = require('../models/consultasModel')
const { nodos, relaciones } = require('./datos')

const cargarNodos = async () => {
    for (const [ruta, { etiqueta }] of Object.entries(ENTIDADES)) {
        const model = crearNodosModel(etiqueta)
        await Promise.all((nodos[ruta] || []).map(model.crear))
    }
}

const cargarRelaciones = async () => {
    for (const [tipo, definicion] of Object.entries(RELACIONES)) {
        const model = crearRelacionModel(tipo, definicion)
        await Promise.all((relaciones[tipo] || []).map(async ([origen, destino, propiedades = {}]) => {
            if (!(await model.guardar(origen, destino, propiedades))) {
                throw new Error(`No existe ${origen} o ${destino} para la relacion ${tipo}`)
            }
        }))
    }
}

const seed = async () => {
    await conectarDB()
    await ejecutar('MATCH (n) DETACH DELETE n')
    await crearRestricciones()
    await cargarNodos()
    await cargarRelaciones()

    const { nodos: totalNodos, relaciones: totalRelaciones } = await resumen()
    console.table(totalNodos)
    console.table(totalRelaciones)
}

seed()
    .then(() => console.log('Seeding completado'))
    .catch((error) => {
        console.error('Error en el seeding:', error.message)
        process.exitCode = 1
    })
    .finally(cerrarDB)
