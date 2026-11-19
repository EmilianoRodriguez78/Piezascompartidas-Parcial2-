// Frontend sin frameworks. Solo habla con la API (nunca con Neo4j directamente).
// Los formularios se generan a partir de GET /api/esquema, el mismo esquema que usa el backend.
//
// Cada relación se captura en el formulario de un nodo:
//  - Relación única (unico): en el formulario del destino, con un selector. Ej.: la marca de un modelo.
//  - Las demás: en el formulario del origen, como una lista de filas. Ej.: los ensambles que usa un modelo.

// Tipo de input para las propiedades que no son texto
const TIPOS = {
    anio_inicio: 'number',
    calificacion: 'number',
    cantidad: 'number',
    costo_unitario: 'number',
    dias_entrega: 'number',
    critica: 'checkbox'
}

// Cómo se llama cada lista de relaciones en el formulario de su origen
const TITULOS_LISTA = {
    USA: 'Ensambles que usa',
    CONTIENE: 'Componentes (piezas o subensambles)',
    SURTE: 'Piezas que surte'
}

// Consultas especializadas: "entrada" es la entidad que se elige en el selector
const CONSULTAS = [
    { titulo: 'Impacto de un proveedor', pregunta: 'Si falla este proveedor, ¿qué marcas y modelos se afectan?', ruta: 'impacto/proveedor', entrada: 'Proveedor' },
    { titulo: 'Impacto de una pieza', pregunta: 'Si falla esta pieza, ¿qué marcas y modelos se afectan?', ruta: 'impacto/pieza', entrada: 'Pieza' },
    { titulo: 'Reutilización', pregunta: '¿Qué ensambles de otras marcas en la misma plataforma puede adoptar este modelo?', ruta: 'reutilizacion', entrada: 'Modelo' },
    { titulo: 'Piezas compartidas', pregunta: '¿Qué piezas se usan en más de una marca?', ruta: 'piezas-compartidas' },
    { titulo: 'Riesgo: proveedor único', pregunta: '¿Qué piezas dependen de un solo proveedor? (críticas primero)', ruta: 'riesgo/proveedor-unico' },
    { titulo: 'Riesgo: modelo único', pregunta: '¿Qué piezas usa un solo modelo? (candidatas a estandarizar)', ruta: 'riesgo/modelo-unico' },
    { titulo: 'Resumen', pregunta: '¿Cuántos nodos y relaciones hay en la base?', ruta: 'resumen' }
]

let esquema
let turnoCatalogo = 0 // evita que una sección lenta reemplace a la que el usuario abrió después

// ---------- Utilidades ----------

const $ = (selector) => document.querySelector(selector)
const enc = encodeURIComponent

// Crea un elemento del DOM. El texto se inserta como texto (no como HTML), así que es seguro.
function el(tag, atributos = {}, ...hijos) {
    const nodo = document.createElement(tag)
    for (const [clave, valor] of Object.entries(atributos)) {
        if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2), valor)
        else nodo[clave] = valor
    }
    nodo.append(...hijos.flat().filter((hijo) => hijo !== null && hijo !== undefined && hijo !== false))
    return nodo
}

async function api(metodo, ruta, body) {
    const respuesta = await fetch(`/api/${ruta}`, {
        method: metodo,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
    }).catch(() => {
        throw new Error('Sin conexión con el servidor\nRevisa que npm run server siga corriendo')
    })
    const datos = await respuesta.json()
    // Ej.: "Error 409 · Conflicto: la operación choca con datos que ya existen" + el detalle
    if (!respuesta.ok) {
        const encabezado = [`Error ${respuesta.status}`, datos.significado].filter(Boolean).join(' · ')
        throw new Error(`${encabezado}\n${datos.message}`)
    }
    return datos
}

function avisar(texto, esError = false) {
    const caja = $('#mensaje')
    // Si el texto trae varias líneas, la primera (código y significado) va en negrita
    const [primera, ...resto] = texto.split('\n')
    caja.replaceChildren(...(resto.length ? [el('strong', {}, primera), resto.join('\n')] : [primera]))
    caja.className = esError ? 'error' : 'ok'
    caja.hidden = false
    clearTimeout(avisar.temporizador)
    // Los errores se quedan más tiempo para alcanzar a leer el significado
    avisar.temporizador = setTimeout(() => (caja.hidden = true), esError ? 8000 : 4000)
}

// Envuelve una acción para mostrar el error al usuario en lugar de dejar la pantalla en blanco
const intentar = (accion) => async (...args) => {
    try {
        await accion(...args)
    } catch (error) {
        avisar(error.message, true)
    }
}

const confirmarYEjecutar = (pregunta, accion) => intentar(async () => {
    if (confirm(pregunta)) await accion()
})

function formatear(valor) {
    if (Array.isArray(valor)) return valor.map(formatear).join(', ')
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
    if (valor && typeof valor === 'object') return Object.entries(valor).map(([k, v]) => `${k}: ${v}`).join(', ')
    return valor ?? ''
}

const legible = (nombre) => nombre.replace(/_/g, ' ')

// Tabla genérica: columnas = todas las claves de las filas (codigo y nombre primero);
// "acciones" agrega botones por fila
function tabla(filas, acciones) {
    if (!filas.length) return el('p', { className: 'vacio' }, 'Sin resultados')
    const columnas = [...new Set(['codigo', 'nombre', ...filas.flatMap(Object.keys)])]
        .filter((columna) => filas.some((fila) => columna in fila))
    return el('table', {},
        el('thead', {}, el('tr', {}, columnas.map((c) => el('th', {}, legible(c))), acciones && el('th'))),
        el('tbody', {}, filas.map((fila) => el('tr', {},
            columnas.map((c) => el('td', {}, String(formatear(fila[c])))),
            acciones && el('td', { className: 'acciones' }, acciones(fila))
        )))
    )
}

function asignar(input, valor) {
    if (input.type === 'checkbox') input.checked = Boolean(valor)
    else input.value = valor ?? ''
}

const input = (nombre) => el('input', { name: nombre, type: TIPOS[nombre] || 'text', step: 'any', placeholder: legible(nombre) })
const campo = (nombre) => el('label', {}, legible(nombre), input(nombre))

// Lee los inputs de un contenedor y convierte cada valor a su tipo (los vacíos se omiten)
function leer(contenedor, propiedades) {
    const datos = {}
    for (const nombre of propiedades) {
        const entrada = contenedor.querySelector(`[name="${nombre}"]`)
        if (entrada.type === 'checkbox') datos[nombre] = entrada.checked
        else if (entrada.value !== '') datos[nombre] = entrada.type === 'number' ? Number(entrada.value) : entrada.value
    }
    return datos
}

const rutaDeEtiqueta = (etiqueta) =>
    Object.keys(esquema.ENTIDADES).find((ruta) => esquema.ENTIDADES[ruta].etiqueta === etiqueta)

// Nodos de una o varias etiquetas, para llenar selectores
async function nodosDe(etiquetas) {
    const listas = await Promise.all(etiquetas.map(async (etiqueta) =>
        (await api('GET', rutaDeEtiqueta(etiqueta))).map((nodo) => ({ ...nodo, etiqueta }))))
    return listas.flat()
}

// <option> por nodo; si hay varias etiquetas (ej. Ensamble y Pieza) se agrupan
function opciones(nodos) {
    const opcion = (nodo) => el('option', { value: nodo.codigo }, `${nodo.codigo} · ${nodo.nombre}`)
    const etiquetas = [...new Set(nodos.map((nodo) => nodo.etiqueta))]
    if (etiquetas.length < 2) return nodos.map(opcion)
    return etiquetas.map((etiqueta) => el('optgroup', { label: etiqueta }, nodos.filter((n) => n.etiqueta === etiqueta).map(opcion)))
}

const panel = (...hijos) => el('div', { className: 'panel' }, ...hijos)

// ---------- Relaciones dentro del formulario de un nodo ----------

// Relación única (ej. la marca de un modelo): un selector en el formulario del destino
async function selectorPadre(tipo, { origen }) {
    const select = el('select', {}, el('option', { value: '' }, '— ninguno —'), opciones(await nodosDe([origen])))
    return {
        tipo,
        columna: origen,
        elemento: el('label', {}, origen, select),
        actual: (relaciones, codigo) => relaciones.find((r) => r.destino === codigo)?.origen || '',
        mostrar: (relaciones, codigo) => { select.value = relaciones.find((r) => r.destino === codigo)?.origen || '' },
        limpiar: () => { select.value = '' },
        // Lo que se manda al backend: el codigo del padre, o null para quitarlo
        valor: () => select.value || null
    }
}

// Las demás relaciones (ej. los ensambles que usa un modelo): filas en el formulario del origen,
// cada una con su destino y las propiedades de la relación (cantidad, costo, ...)
async function listaHijos(tipo, { destino, propiedades }) {
    const candidatos = await nodosDe(destino)
    const filas = el('div', { className: 'filas' })

    function agregarFila(codigoDestino = '', valores = {}) {
        const select = el('select', { name: 'destino' }, el('option', { value: '' }, '— elegir —'), opciones(candidatos))
        select.value = codigoDestino
        const entradas = propiedades.map((nombre) => {
            const entrada = input(nombre)
            asignar(entrada, valores[nombre])
            return entrada
        })
        const fila = el('div', { className: 'fila' }, select, entradas,
            el('button', { type: 'button', className: 'peligro', title: 'Quitar', onclick: () => fila.remove() }, '✕'))
        filas.append(fila)
    }

    const titulo = TITULOS_LISTA[tipo] || `${destino.join(' o ')} (${tipo})`
    return {
        tipo,
        columna: titulo,
        elemento: el('fieldset', {}, el('legend', {}, titulo), filas,
            el('button', { type: 'button', onclick: () => agregarFila() }, '+ Agregar')),
        actual: (relaciones, codigo) => relaciones.filter((r) => r.origen === codigo)
            .map((r) => [r.destino, formatear(r.propiedades)].filter(Boolean).join(' · ')),
        mostrar: (relaciones, codigo) => {
            filas.replaceChildren()
            relaciones.filter((r) => r.origen === codigo).forEach((r) => agregarFila(r.destino, r.propiedades))
        },
        limpiar: () => filas.replaceChildren(),
        // Lo que se manda al backend: la lista completa (el backend quita las que ya no están)
        valor: () => [...filas.children]
            .map((fila) => ({ destino: fila.querySelector('select').value, propiedades: leer(fila, propiedades) }))
            .filter((fila) => fila.destino)
    }
}

// Editores de relaciones que van en el formulario de una etiqueta (la regla vive en el backend)
function editoresDe(etiqueta) {
    return Promise.all(esquema.EDITABLES[etiqueta].map(({ tipo, lado }) =>
        lado === 'padre' ? selectorPadre(tipo, esquema.RELACIONES[tipo]) : listaHijos(tipo, esquema.RELACIONES[tipo])))
}

// ---------- Catálogo: un nodo con sus relaciones ----------

async function vistaEntidad(ruta) {
    const turno = ++turnoCatalogo
    const { etiqueta, propiedades } = esquema.ENTIDADES[ruta]
    const editores = await editoresDe(etiqueta)
    if (turno !== turnoCatalogo) return // el usuario ya abrió otra sección

    let editando = null
    let relaciones = {} // tipo → relaciones actuales de ese tipo

    const titulo = el('h2')
    const codigo = el('input', { name: 'codigo', required: true })
    const camposNodo = el('div', { className: 'formulario' }, el('label', {}, 'codigo', codigo), propiedades.map(campo))
    const lista = el('div')
    const form = el('form', { className: 'formulario' },
        camposNodo,
        editores.map((editor) => editor.elemento),
        el('div', { className: 'botones' },
            el('button', { type: 'submit' }, 'Guardar'),
            el('button', { type: 'button', onclick: () => limpiar() }, 'Cancelar')
        )
    )

    function limpiar() {
        editando = null
        form.reset()
        editores.forEach((editor) => editor.limpiar())
        codigo.disabled = false
        titulo.textContent = `Crear ${etiqueta}`
    }

    function editar(nodo) {
        editando = nodo.codigo
        codigo.value = nodo.codigo
        codigo.disabled = true // el codigo es el identificador, no se cambia
        propiedades.forEach((nombre) => asignar(camposNodo.querySelector(`[name="${nombre}"]`), nodo[nombre]))
        editores.forEach((editor) => editor.mostrar(relaciones[editor.tipo], nodo.codigo))
        titulo.textContent = `Editar ${etiqueta} ${nodo.codigo}`
        form.scrollIntoView({ behavior: 'smooth' })
    }

    async function cargar() {
        const [nodos, ...listas] = await Promise.all([
            api('GET', ruta),
            ...editores.map((editor) => api('GET', `relaciones/${editor.tipo}`))
        ])
        relaciones = Object.fromEntries(editores.map((editor, i) => [editor.tipo, listas[i]]))

        // Cada relación se muestra como una columna más de la tabla
        const filas = nodos.map((nodo) => ({
            ...nodo,
            ...Object.fromEntries(editores.map((editor) => [editor.columna, editor.actual(relaciones[editor.tipo], nodo.codigo)]))
        }))
        lista.replaceChildren(tabla(filas, (nodo) => [
            el('button', { onclick: () => editar(nodos.find((n) => n.codigo === nodo.codigo)) }, 'Editar'),
            el('button', {
                className: 'peligro',
                onclick: confirmarYEjecutar(`¿Eliminar ${etiqueta} ${nodo.codigo} y todas sus relaciones?`, async () => {
                    await api('DELETE', `${ruta}/${enc(nodo.codigo)}`)
                    avisar(`Se eliminó ${etiqueta} ${nodo.codigo}`)
                    limpiar()
                    await cargar()
                })
            }, 'Eliminar')
        ]))
    }

    form.addEventListener('submit', intentar(async (evento) => {
        evento.preventDefault()
        const codigoNodo = editando || codigo.value.trim()
        // Una sola petición con el nodo y sus relaciones: el backend las guarda en una transacción
        const cuerpo = {
            ...leer(camposNodo, propiedades),
            relaciones: Object.fromEntries(editores.map((editor) => [editor.tipo, editor.valor()]))
        }
        if (editando) await api('PUT', `${ruta}/${enc(editando)}`, cuerpo)
        else await api('POST', ruta, { codigo: codigoNodo, ...cuerpo })

        avisar(`${editando ? 'Se actualizó' : 'Se creó'} ${etiqueta} ${codigoNodo}`)
        limpiar()
        await cargar()
    }))

    $('#contenido-catalogo').replaceChildren(panel(titulo, form), panel(el('h2', {}, `Registros: ${etiqueta}`), lista))
    limpiar()
    await cargar()
}

// ---------- Consultas especializadas ----------

async function vistaConsultas() {
    const tarjetas = await Promise.all(CONSULTAS.map(async ({ titulo, pregunta, ruta, entrada }) => {
        const resultado = el('div', { className: 'resultado' })
        const selector = entrada && el('select', {}, opciones(await nodosDe([entrada])))

        const consultar = intentar(async () => {
            const datos = await api('GET', `consultas/${ruta}${selector ? `/${enc(selector.value)}` : ''}`)
            resultado.replaceChildren(...(Array.isArray(datos)
                ? [tabla(datos)]
                : Object.entries(datos).flatMap(([nombre, filas]) => [el('h4', {}, nombre), tabla(filas)])))
        })

        return el('article', { className: 'panel' },
            el('h3', {}, titulo),
            el('p', {}, pregunta),
            el('div', { className: 'botones' }, selector, el('button', { type: 'submit', onclick: consultar }, 'Consultar')),
            resultado
        )
    }))
    $('#consultas').replaceChildren(...tarjetas)
}

// ---------- Navegación ----------

const activar = (grupo, boton) =>
    document.querySelectorAll(`${grupo} button`).forEach((b) => b.classList.toggle('activa', b === boton))

async function iniciar() {
    esquema = await api('GET', 'esquema')

    $('#secciones').replaceChildren(...Object.entries(esquema.ENTIDADES).map(([ruta, { etiqueta }]) =>
        el('button', {
            onclick: intentar(async (evento) => {
                activar('#secciones', evento.currentTarget)
                await vistaEntidad(ruta)
            })
        }, etiqueta)
    ))

    document.querySelectorAll('#pestanas button').forEach((boton) => boton.addEventListener('click', intentar(async () => {
        activar('#pestanas', boton)
        $('#catalogo').hidden = boton.dataset.vista !== 'catalogo'
        $('#consultas').hidden = boton.dataset.vista !== 'consultas'
        if (boton.dataset.vista === 'consultas') await vistaConsultas() // recarga los selectores con los datos actuales
    })))

    $('#secciones button').click()
}

intentar(iniciar)()
