// Deja la base de datos en el estado inicial para las pruebas:
// BORRA TODO el grafo y carga los datos de datos.js. Uso: npm run seed
//
// Atomicidad: el borrado y la carga van en UNA transacción. Si algo falla a la mitad,
// Neo4j deshace todo (incluido el borrado) y la base queda como estaba.
require('dotenv').config({ quiet: true })
const { conectarDB, ejecutar, enTransaccion, cerrarDB } = require('./db')
const { ENTIDADES, RELACIONES } = require('./esquema')
const { crearNodosModel, crearRestricciones } = require('../models/nodosModel')
const crearRelacionModel = require('../models/relacionesModel')
const { resumen } = require('../models/consultasModel')
const { nodos, relaciones } = require('./datos')

// Dentro de una transacción las consultas van una tras otra
const cargarNodos = async () => {
    for (const [ruta, { etiqueta }] of Object.entries(ENTIDADES)) {
        const model = crearNodosModel(etiqueta)
        for (const nodo of nodos[ruta] || []) await model.crear(nodo)
    }
}

const cargarRelaciones = async () => {
    for (const [tipo, definicion] of Object.entries(RELACIONES)) {
        const model = crearRelacionModel(tipo, definicion)
        for (const [origen, destino, propiedades = {}] of relaciones[tipo] || []) {
            if (!(await model.guardar(origen, destino, propiedades))) {
                throw new Error(`No existe ${origen} o ${destino} para la relacion ${tipo}`)
            }
        }
    }
}

const seed = async () => {
    await conectarDB()
    // Aparte y antes: Neo4j no permite mezclar cambios de esquema y de datos en la misma transacción
    await crearRestricciones()

    await enTransaccion(async () => {
        await ejecutar('MATCH (n) DETACH DELETE n')
        await cargarNodos()
        await cargarRelaciones()
    })

    const { nodos: totalNodos, relaciones: totalRelaciones } = await resumen()
    console.table(totalNodos)
    console.table(totalRelaciones)
}

seed()
    .then(() => console.log('Seeding completado'))
    .catch((error) => {
        console.error('Error en el seeding (no se cambió nada en la base):', error.message)
        process.exitCode = 1
    })
    .finally(cerrarDB)
