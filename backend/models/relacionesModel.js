const { ejecutar } = require('../config/db')

// Modelo genérico para un tipo de relación definido en config/esquema.js.
// Una relación se identifica por (origen, destino); sus propiedades viven en la relación
// (por ejemplo, la cantidad de piezas de un ensamble o el costo de un proveedor).
const crearRelacionModel = (tipo, { origen, destino, unico }) => {
    // (b:Ensamble OR b:Pieza) cuando el destino admite varias etiquetas
    const filtroDestino = destino.map((etiqueta) => `b:${etiqueta}`).join(' OR ')
    const devolver = 'RETURN a.codigo AS origen, b.codigo AS destino, properties(r) AS propiedades'
    // Relación única: antes de crear la nueva se quita la que el destino tuviera con otro origen.
    // Aislamiento: primero se bloquea el destino (escribir en él toma su candado hasta el commit).
    // Así, si dos peticiones asignan a la vez otra marca al mismo modelo, la segunda espera,
    // ve la relación que dejó la primera y la reemplaza: nunca quedan dos.
    const quitarAnterior = unico
        ? `SET b._bloqueo = true REMOVE b._bloqueo
           WITH a, b
           OPTIONAL MATCH (otro:${origen})-[anterior:${tipo}]->(b) WHERE otro <> a
           DELETE anterior
           WITH DISTINCT a, b`
        : ''

    return {
        listar: () => ejecutar(
            `MATCH (a:${origen})-[r:${tipo}]->(b) ${devolver} ORDER BY origen, destino`
        ),

        // MERGE: crea la relación si no existe o actualiza sus propiedades si ya existe.
        // Devuelve null si alguno de los dos nodos no existe.
        guardar: async (codigoOrigen, codigoDestino, propiedades) => {
            const filas = await ejecutar(
                `MATCH (a:${origen} {codigo: $codigoOrigen})
                 MATCH (b) WHERE b.codigo = $codigoDestino AND (${filtroDestino})
                 ${quitarAnterior}
                 MERGE (a)-[r:${tipo}]->(b)
                 SET r += $propiedades
                 ${devolver}`,
                { codigoOrigen, codigoDestino, propiedades }
            )
            return filas[0] || null
        },

        eliminar: async (codigoOrigen, codigoDestino) => {
            const [{ eliminadas }] = await ejecutar(
                `MATCH (a:${origen} {codigo: $codigoOrigen})-[r:${tipo}]->(b {codigo: $codigoDestino})
                 DELETE r
                 RETURN count(*) AS eliminadas`,
                { codigoOrigen, codigoDestino }
            )
            return eliminadas > 0
        },

        // Quita la relación que llega a este destino (ej. dejar un modelo sin plataforma)
        quitarPadre: (codigoDestino) => ejecutar(
            `MATCH (:${origen})-[r:${tipo}]->(b {codigo: $codigoDestino}) WHERE ${filtroDestino}
             DELETE r`,
            { codigoDestino }
        ),

        // Quita las relaciones que salen de este origen hacia destinos que ya no están en la lista
        quitarHijosExcepto: (codigoOrigen, destinosQueQuedan) => ejecutar(
            `MATCH (a:${origen} {codigo: $codigoOrigen})-[r:${tipo}]->(b)
             WHERE NOT b.codigo IN $destinosQueQuedan
             DELETE r`,
            { codigoOrigen, destinosQueQuedan }
        )
    }
}

module.exports = crearRelacionModel
