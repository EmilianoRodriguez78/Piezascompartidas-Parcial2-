const neo4j = require('neo4j-driver')

let driver

const conectarDB = async () => {
    const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env
    if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
        throw new Error('Faltan NEO4J_URI, NEO4J_USER o NEO4J_PASSWORD en el archivo .env')
    }

    driver = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
        { disableLosslessIntegers: true } // devuelve números normales de JS, no {low, high}
    )
    const info = await driver.getServerInfo()
    console.log(`Conectado a Neo4j: ${info.address}`)
}

// JavaScript solo tiene "number": sin esto, 2024 se guardaría en Neo4j como 2024.0
const conEnteros = (valor) => {
    if (Number.isInteger(valor)) return neo4j.int(valor)
    if (Array.isArray(valor)) return valor.map(conEnteros)
    if (valor && typeof valor === 'object') {
        return Object.fromEntries(Object.entries(valor).map(([clave, v]) => [clave, conEnteros(v)]))
    }
    return valor
}

// Ejecuta una consulta Cypher y devuelve un arreglo de objetos planos.
// El driver abre y cierra la sesión por nosotros en cada llamada.
const ejecutar = async (cypher, params = {}) => {
    const { records } = await driver.executeQuery(cypher, conEnteros(params))
    return records.map((registro) => registro.toObject())
}

const cerrarDB = async () => {
    if (driver) await driver.close()
}

module.exports = { conectarDB, ejecutar, cerrarDB }
