const { ejecutar } = require('../config/db')
const { ENTIDADES } = require('../config/esquema')

// Una restricción de unicidad de codigo por etiqueta: evita duplicados y crea el índice
// para buscar por codigo. IF NOT EXISTS la hace segura de ejecutar en cada arranque.
const crearRestricciones = async () => {
    for (const { etiqueta } of Object.values(ENTIDADES)) {
        await ejecutar(
            `CREATE CONSTRAINT ${etiqueta.toLowerCase()}_codigo IF NOT EXISTS
             FOR (n:${etiqueta}) REQUIRE n.codigo IS UNIQUE`
        )
    }
}

// Modelo CRUD genérico para una etiqueta de nodo.
// La etiqueta viene de config/esquema.js (nunca del usuario), por eso es seguro
// interpolarla: Cypher no permite parametrizar etiquetas. Los valores sí van como $parametros.
const crearNodosModel = (etiqueta) => {
    const primero = (filas) => (filas.length ? filas[0].nodo : null)

    return {
        listar: async () => {
            const filas = await ejecutar(
                `MATCH (n:${etiqueta}) RETURN n {.*} AS nodo ORDER BY nodo.nombre`
            )
            return filas.map((fila) => fila.nodo)
        },

        obtener: async (codigo) => primero(await ejecutar(
            `MATCH (n:${etiqueta} {codigo: $codigo}) RETURN n {.*} AS nodo`,
            { codigo }
        )),

        crear: async (datos) => primero(await ejecutar(
            `CREATE (n:${etiqueta}) SET n = $datos RETURN n {.*} AS nodo`,
            { datos }
        )),

        actualizar: async (codigo, cambios) => primero(await ejecutar(
            `MATCH (n:${etiqueta} {codigo: $codigo}) SET n += $cambios RETURN n {.*} AS nodo`,
            { codigo, cambios }
        )),

        // DETACH DELETE borra también sus relaciones. Devuelve true si existía.
        eliminar: async (codigo) => {
            const [{ eliminados }] = await ejecutar(
                `MATCH (n:${etiqueta} {codigo: $codigo}) DETACH DELETE n RETURN count(*) AS eliminados`,
                { codigo }
            )
            return eliminados > 0
        }
    }
}

module.exports = { crearNodosModel, crearRestricciones }
