// Única fuente de verdad del modelo de grafo.
// Rutas, repositorios, validación y seeding se generan a partir de aquí:
// agregar una entidad o relación nueva es agregar una línea en este archivo.

// Clave = segmento de la URL (/api/<clave>)
const ENTIDADES = {
    grupos:      { etiqueta: 'Grupo',      propiedades: ['nombre', 'pais'] },
    marcas:      { etiqueta: 'Marca',      propiedades: ['nombre', 'segmento'] },
    plataformas: { etiqueta: 'Plataforma', propiedades: ['nombre', 'tipo_propulsion'] },
    modelos:     { etiqueta: 'Modelo',     propiedades: ['nombre', 'anio_inicio', 'carroceria'] },
    ensambles:   { etiqueta: 'Ensamble',   propiedades: ['nombre', 'categoria'] },
    piezas:      { etiqueta: 'Pieza',      propiedades: ['nombre', 'categoria', 'critica'] },
    proveedores: { etiqueta: 'Proveedor',  propiedades: ['nombre', 'pais', 'calificacion'] }
}

// Dirección: de lo general a lo particular.
// unico: el destino tiene un solo origen (un modelo tiene una sola marca); asignar otro reemplaza al anterior.
const RELACIONES = {
    TIENE_MARCA: { origen: 'Grupo',      destino: ['Marca'],             propiedades: [], unico: true },
    FABRICA:     { origen: 'Marca',      destino: ['Modelo'],            propiedades: [], unico: true },
    BASE_DE:     { origen: 'Plataforma', destino: ['Modelo'],            propiedades: [], unico: true },
    USA:         { origen: 'Modelo',     destino: ['Ensamble'],          propiedades: [] },
    CONTIENE:    { origen: 'Ensamble',   destino: ['Ensamble', 'Pieza'], propiedades: ['cantidad'] },
    SURTE:       { origen: 'Proveedor',  destino: ['Pieza'],             propiedades: ['costo_unitario', 'dias_entrega'] }
}

// Niveles máximos de ensamble → subensamble → pieza que recorren las consultas
const PROFUNDIDAD_MAXIMA = 6

// Neo4j solo guarda valores simples como propiedad (no objetos)
const esValorSimple = (valor) => ['string', 'number', 'boolean'].includes(typeof valor)

// Copia del body solo con las propiedades del esquema que traen un valor simple (ignora el resto)
const filtrarPropiedades = (datos = {}, permitidas) =>
    Object.fromEntries(Object.entries(datos).filter(([clave, valor]) => permitidas.includes(clave) && esValorSimple(valor)))

module.exports = { ENTIDADES, RELACIONES, PROFUNDIDAD_MAXIMA, filtrarPropiedades }
