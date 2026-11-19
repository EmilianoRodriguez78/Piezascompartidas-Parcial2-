// Frontend sin frameworks. Solo habla con la API (nunca con Neo4j directamente).
// Los formularios se generan a partir de GET /api/esquema, el mismo esquema que usa el backend.

// Tipo de input para las propiedades que no son texto
const TIPOS = {
    anio_inicio: 'number',
    calificacion: 'number',
    cantidad: 'number',
    costo_unitario: 'number',
    dias_entrega: 'number',
    critica: 'checkbox'
}

// Consultas especializadas: "entrada" es la entidad que se elige en el selector
const CONSULTAS = [
    { titulo: 'Impacto de un proveedor', pregunta: 'Si falla este proveedor, ¿qué marcas y modelos se afectan?', ruta: 'impacto/proveedor', entrada: 'proveedores' },
    { titulo: 'Impacto de una pieza', pregunta: 'Si falla esta pieza, ¿qué marcas y modelos se afectan?', ruta: 'impacto/pieza', entrada: 'piezas' },
    { titulo: 'Reutilización', pregunta: '¿Qué ensambles de otras marcas en la misma plataforma puede adoptar este modelo?', ruta: 'reutilizacion', entrada: 'modelos' },
    { titulo: 'Piezas compartidas', pregunta: '¿Qué piezas se usan en más de una marca?', ruta: 'piezas-compartidas' },
    { titulo: 'Riesgo: proveedor único', pregunta: '¿Qué piezas dependen de un solo proveedor? (críticas primero)', ruta: 'riesgo/proveedor-unico' },
    { titulo: 'Riesgo: modelo único', pregunta: '¿Qué piezas usa un solo modelo? (candidatas a estandarizar)', ruta: 'riesgo/modelo-unico' },
    { titulo: 'Resumen', pregunta: '¿Cuántos nodos y relaciones hay en la base?', ruta: 'resumen' }
]

let esquema

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
    if (Array.isArray(valor)) return valor.join(', ')
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

function campo(nombre) {
    const input = el('input', { name: nombre, type: TIPOS[nombre] || 'text', step: 'any' })
    return el('label', {}, legible(nombre), input)
}

// Lee los inputs de un formulario y convierte cada valor a su tipo (los vacíos se omiten)
function leer(form, propiedades) {
    const datos = {}
    for (const nombre of propiedades) {
        const input = form.elements[nombre]
        if (input.type === 'checkbox') datos[nombre] = input.checked
        else if (input.value !== '') datos[nombre] = input.type === 'number' ? Number(input.value) : input.value
    }
    return datos
}

const rutaDeEtiqueta = (etiqueta) =>
    Object.keys(esquema.ENTIDADES).find((ruta) => esquema.ENTIDADES[ruta].etiqueta === etiqueta)

// Opciones de un <select> con los nodos de una o varias entidades
async function opciones(rutas) {
    const listas = await Promise.all(rutas.map((ruta) => api('GET', ruta)))
    return listas.flat().map((nodo) => el('option', { value: nodo.codigo }, `${nodo.codigo} · ${nodo.nombre}`))
}

const panel = (...hijos) => el('div', { className: 'panel' }, ...hijos)

// ---------- Catálogo: CRUD de una entidad ----------

async function vistaEntidad(ruta) {
    const { etiqueta, propiedades } = esquema.ENTIDADES[ruta]
    let editando = null

    const titulo = el('h2')
    const codigo = el('input', { name: 'codigo', required: true })
    const lista = el('div')
    const form = el('form', { className: 'formulario' },
        el('label', {}, 'codigo', codigo),
        propiedades.map(campo),
        el('div', { className: 'botones' },
            el('button', { type: 'submit' }, 'Guardar'),
            el('button', { type: 'button', onclick: () => limpiar() }, 'Cancelar')
        )
    )

    function limpiar() {
        editando = null
        form.reset()
        codigo.disabled = false
        titulo.textContent = `Crear ${etiqueta}`
    }

    function editar(nodo) {
        editando = nodo.codigo
        codigo.value = nodo.codigo
        codigo.disabled = true // el codigo es el identificador, no se cambia
        propiedades.forEach((nombre) => asignar(form.elements[nombre], nodo[nombre]))
        titulo.textContent = `Editar ${etiqueta} ${nodo.codigo}`
    }

    async function cargar() {
        const nodos = await api('GET', ruta)
        lista.replaceChildren(tabla(nodos, (nodo) => [
            el('button', { onclick: () => editar(nodo) }, 'Editar'),
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
        const datos = leer(form, propiedades)
        if (editando) {
            await api('PUT', `${ruta}/${enc(editando)}`, datos)
            avisar(`Se actualizó ${etiqueta} ${editando}`)
        } else {
            await api('POST', ruta, { codigo: codigo.value.trim(), ...datos })
            avisar(`Se creó ${etiqueta} ${codigo.value.trim()}`)
        }
        limpiar()
        await cargar()
    }))

    $('#contenido-catalogo').replaceChildren(panel(titulo, form), panel(el('h2', {}, `Registros: ${etiqueta}`), lista))
    limpiar()
    await cargar()
}

// ---------- Catálogo: relaciones ----------

async function vistaRelaciones() {
    const selectorTipo = el('select', {}, Object.entries(esquema.RELACIONES).map(([tipo, { origen, destino }]) =>
        el('option', { value: tipo }, `(${origen}) -[${tipo}]-> (${destino.join(' | ')})`)
    ))
    const form = el('form', { className: 'formulario' })
    const lista = el('div')
    const tituloLista = el('h2')

    async function mostrarTipo() {
        const tipo = selectorTipo.value
        const { origen, destino, propiedades } = esquema.RELACIONES[tipo]
        // Si el usuario cambió de tipo mientras cargaba, esta respuesta ya no se muestra
        const sigueSeleccionado = () => selectorTipo.value === tipo

        const selectorOrigen = el('select', { name: 'origen' }, await opciones([rutaDeEtiqueta(origen)]))
        const selectorDestino = el('select', { name: 'destino' }, await opciones(destino.map(rutaDeEtiqueta)))
        if (!sigueSeleccionado()) return

        async function cargar() {
            const relaciones = await api('GET', `relaciones/${tipo}`)
            if (!sigueSeleccionado()) return
            tituloLista.textContent = `Registros: ${tipo} (${relaciones.length})`
            lista.replaceChildren(tabla(relaciones, (relacion) => [
                el('button', {
                    onclick: () => {
                        selectorOrigen.value = relacion.origen
                        selectorDestino.value = relacion.destino
                        propiedades.forEach((nombre) => asignar(form.elements[nombre], relacion.propiedades[nombre]))
                    }
                }, 'Editar'),
                el('button', {
                    className: 'peligro',
                    onclick: confirmarYEjecutar(`¿Eliminar ${relacion.origen} -[${tipo}]-> ${relacion.destino}?`, async () => {
                        await api('DELETE', `relaciones/${tipo}/${enc(relacion.origen)}/${enc(relacion.destino)}`)
                        avisar('Relación eliminada')
                        await cargar()
                    })
                }, 'Eliminar')
            ]))
        }

        // PUT crea la relación o, si ya existe, actualiza sus propiedades
        form.onsubmit = intentar(async (evento) => {
            evento.preventDefault()
            await api('PUT', `relaciones/${tipo}/${enc(selectorOrigen.value)}/${enc(selectorDestino.value)}`, leer(form, propiedades))
            avisar('Relación guardada')
            await cargar()
        })

        form.replaceChildren(
            el('label', {}, `Origen (${origen})`, selectorOrigen),
            el('label', {}, `Destino (${destino.join(' o ')})`, selectorDestino),
            ...propiedades.map(campo),
            el('div', { className: 'botones' }, el('button', { type: 'submit' }, 'Guardar relación'))
        )
        await cargar()
    }

    selectorTipo.addEventListener('change', intentar(mostrarTipo))
    $('#contenido-catalogo').replaceChildren(
        panel(el('h2', {}, 'Relaciones'), el('label', {}, 'Tipo de relación', selectorTipo), form),
        panel(tituloLista, lista)
    )
    await mostrarTipo()
}

// ---------- Consultas especializadas ----------

async function vistaConsultas() {
    const tarjetas = await Promise.all(CONSULTAS.map(async ({ titulo, pregunta, ruta, entrada }) => {
        const resultado = el('div', { className: 'resultado' })
        const selector = entrada && el('select', {}, await opciones([entrada]))

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

    const secciones = [
        ...Object.entries(esquema.ENTIDADES).map(([ruta, { etiqueta }]) => [etiqueta, () => vistaEntidad(ruta)]),
        ['Relaciones', vistaRelaciones]
    ]
    $('#secciones').replaceChildren(...secciones.map(([nombre, vista]) =>
        el('button', { onclick: intentar(async (evento) => { activar('#secciones', evento.currentTarget); await vista() }) }, nombre)
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
