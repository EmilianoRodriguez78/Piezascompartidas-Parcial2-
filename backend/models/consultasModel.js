const { ejecutar } = require('../config/db')
const { PROFUNDIDAD_MAXIMA } = require('../config/esquema')

// Recorrido de profundidad variable: modelo → ensamble → (subensambles) → pieza.
// :Pieza es necesario: CONTIENE también apunta a subensambles, que no deben contarse como piezas.
const RUTA_A_PIEZA = `(:Ensamble)-[:CONTIENE*1..${PROFUNDIDAD_MAXIMA}]->(pz:Pieza)`

// Dadas unas piezas (pz), qué marcas y modelos dependen de ellas
const IMPACTO = `
    MATCH (ma:Marca)-[:FABRICA]->(m:Modelo)-[:USA]->${RUTA_A_PIEZA}
    RETURN ma.nombre AS marca,
           collect(DISTINCT m.nombre) AS modelos,
           count(DISTINCT pz) AS piezas_afectadas
    ORDER BY marca`

// Conteo de nodos y relaciones, para verificar la conexión y el seeding
const resumen = async () => ({
    nodos: await ejecutar('MATCH (n) RETURN labels(n)[0] AS etiqueta, count(*) AS total ORDER BY etiqueta'),
    relaciones: await ejecutar('MATCH ()-[r]->() RETURN type(r) AS relacion, count(*) AS total ORDER BY relacion')
})

// Si falla este proveedor, ¿qué marcas y modelos se afectan?
const impactoProveedor = (codigo) => ejecutar(
    `MATCH (:Proveedor {codigo: $codigo})-[:SURTE]->(pz:Pieza) ${IMPACTO}`,
    { codigo }
)

// Si falla esta pieza, ¿qué marcas y modelos se afectan?
const impactoPieza = (codigo) => ejecutar(
    `MATCH (pz:Pieza {codigo: $codigo}) ${IMPACTO}`,
    { codigo }
)

// Ensambles que usan otras marcas sobre la misma plataforma y que el modelo aún no usa
const reutilizacion = (codigoModelo) => ejecutar(
    `MATCH (nuevo:Modelo {codigo: $codigoModelo})<-[:FABRICA]-(marcaNueva:Marca)
     MATCH (pl:Plataforma)-[:BASE_DE]->(nuevo)
     MATCH (pl)-[:BASE_DE]->(otro:Modelo)<-[:FABRICA]-(otraMarca:Marca)
     WHERE otraMarca <> marcaNueva
     MATCH (otro)-[:USA]->(e:Ensamble)
     WHERE NOT (nuevo)-[:USA]->(e)
     RETURN e.codigo AS codigo,
            e.nombre AS ensamble,
            collect(DISTINCT otraMarca.nombre) AS marcas,
            collect(DISTINCT otro.nombre) AS modelos
     ORDER BY ensamble`,
    { codigoModelo }
)

// Piezas presentes en modelos de más de una marca
const piezasCompartidas = () => ejecutar(
    `MATCH (ma:Marca)-[:FABRICA]->(:Modelo)-[:USA]->${RUTA_A_PIEZA}
     WITH pz, collect(DISTINCT ma.nombre) AS marcas
     WHERE size(marcas) > 1
     RETURN pz.codigo AS codigo, pz.nombre AS pieza, marcas, size(marcas) AS num_marcas
     ORDER BY num_marcas DESC, pieza`
)

// Riesgo: piezas que dependen de un único proveedor (las críticas primero)
const piezasProveedorUnico = () => ejecutar(
    `MATCH (v:Proveedor)-[:SURTE]->(pz:Pieza)
     WITH pz, collect(v.nombre) AS proveedores
     WHERE size(proveedores) = 1
     RETURN pz.codigo AS codigo, pz.nombre AS pieza, proveedores[0] AS proveedor, pz.critica AS critica
     ORDER BY critica DESC, pieza`
)

// Riesgo: piezas usadas por un solo modelo (candidatas a estandarizar)
const piezasModeloUnico = () => ejecutar(
    `MATCH (m:Modelo)-[:USA]->${RUTA_A_PIEZA}
     WITH pz, collect(DISTINCT m.nombre) AS modelos
     WHERE size(modelos) = 1
     RETURN pz.codigo AS codigo, pz.nombre AS pieza, modelos[0] AS modelo
     ORDER BY pieza`
)

module.exports = {
    resumen,
    impactoProveedor,
    impactoPieza,
    reutilizacion,
    piezasCompartidas,
    piezasProveedorUnico,
    piezasModeloUnico
}
