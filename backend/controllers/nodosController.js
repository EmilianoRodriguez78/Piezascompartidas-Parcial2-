const { HttpError, existeOr404 } = require('../middleware/errorMiddleware')
const { filtrarPropiedades } = require('../config/esquema')
const { enTransaccion } = require('../config/db')

// Controlador CRUD genérico: valida la petición y delega en los modelos.
// Express 5 envía automáticamente al errorHandler los errores de funciones async.
//
// "editables" son las relaciones que se guardan junto con el nodo (ver relacionesEditables en esquema.js),
// cada una con su modelo: { tipo, lado: 'padre' | 'hijos', relacion, model }.
// El body puede traerlas en "relaciones", por ejemplo para un Modelo:
//   { "relaciones": { "FABRICA": "MRC-Vela", "BASE_DE": null, "USA": [{ "destino": "ENS-AIRBAG" }] } }
const crearControladorNodos = ({ etiqueta, propiedades }, model, editables = []) => {
    const noExiste = (codigo) => `No existe ${etiqueta} con codigo ${codigo}`

    // Valida body.relaciones antes de tocar la base (solo las relaciones que van con esta etiqueta)
    function leerRelaciones(body, codigo) {
        const enviadas = body?.relaciones
        if (enviadas === undefined) return []
        if (!enviadas || typeof enviadas !== 'object' || Array.isArray(enviadas)) {
            throw new HttpError(400, 'relaciones debe ser un objeto: { TIPO: valor }')
        }

        return editables.filter(({ tipo }) => tipo in enviadas).map((editable) => {
            const { tipo, lado, relacion } = editable
            const valor = enviadas[tipo]

            if (lado === 'padre') {
                if (valor !== null && valor !== '' && typeof valor !== 'string') {
                    throw new HttpError(400, `${tipo} debe ser el codigo de un ${relacion.origen} o null`)
                }
                return { ...editable, padre: valor || null }
            }

            if (!Array.isArray(valor)) throw new HttpError(400, `${tipo} debe ser una lista de { destino, propiedades }`)
            const hijos = valor.map((hijo) => ({
                destino: typeof hijo?.destino === 'string' ? hijo.destino.trim() : '',
                propiedades: filtrarPropiedades(hijo?.propiedades, relacion.propiedades)
            }))
            if (hijos.some((hijo) => !hijo.destino)) throw new HttpError(400, `Cada elemento de ${tipo} necesita un destino`)
            if (hijos.some((hijo) => hijo.destino === codigo)) throw new HttpError(400, 'Un nodo no puede relacionarse consigo mismo')
            return { ...editable, hijos }
        })
    }

    // Aplica las relaciones. Si un nodo relacionado no existe, lanza 404 y la transacción se deshace completa.
    async function guardarRelaciones(codigo, cambios) {
        for (const { tipo, lado, relacion, model: relacionModel, padre, hijos } of cambios) {
            if (lado === 'padre') {
                if (!padre) await relacionModel.quitarPadre(codigo)
                else existeOr404(await relacionModel.guardar(padre, codigo, {}), `No existe ${relacion.origen} con codigo ${padre} (${tipo})`)
                continue
            }
            await relacionModel.quitarHijosExcepto(codigo, hijos.map((hijo) => hijo.destino))
            for (const { destino, propiedades: valores } of hijos) {
                existeOr404(await relacionModel.guardar(codigo, destino, valores),
                    `No existe ${relacion.destino.join(' o ')} con codigo ${destino} (${tipo})`)
            }
        }
    }

    return {
        listar: async (req, res) => {
            res.status(200).json(await model.listar())
        },

        obtener: async (req, res) => {
            const { codigo } = req.params
            res.status(200).json(existeOr404(await model.obtener(codigo), noExiste(codigo)))
        },

        // Atomicidad: el nodo y sus relaciones se crean juntos o no se crea nada
        crear: async (req, res) => {
            // El codigo debe ser texto: en la URL (/api/piezas/:codigo) siempre llega como texto
            const codigo = typeof req.body?.codigo === 'string' ? req.body.codigo.trim() : ''
            const datos = filtrarPropiedades(req.body, propiedades)
            if (!codigo || !datos.nombre) {
                throw new HttpError(400, 'Faltan datos: codigo y nombre son obligatorios (codigo como texto)')
            }
            const cambiosRelaciones = leerRelaciones(req.body, codigo)

            const nodo = await enTransaccion(async () => {
                const creado = await model.crear({ codigo, ...datos })
                await guardarRelaciones(codigo, cambiosRelaciones)
                return creado
            })
            res.status(201).json(nodo)
        },

        // El codigo es el identificador, por eso no se puede modificar.
        // Atomicidad: propiedades y relaciones se actualizan juntas o no cambia nada
        actualizar: async (req, res) => {
            const { codigo } = req.params
            const cambios = filtrarPropiedades(req.body, propiedades)
            const cambiosRelaciones = leerRelaciones(req.body, codigo)
            if (Object.keys(cambios).length === 0 && cambiosRelaciones.length === 0) {
                throw new HttpError(400, `Nada que actualizar. Propiedades permitidas: ${propiedades.join(', ')}`)
            }

            const nodo = await enTransaccion(async () => {
                const actualizado = Object.keys(cambios).length
                    ? await model.actualizar(codigo, cambios)
                    : await model.obtener(codigo)
                existeOr404(actualizado, noExiste(codigo))
                await guardarRelaciones(codigo, cambiosRelaciones)
                return actualizado
            })
            res.status(200).json(nodo)
        },

        eliminar: async (req, res) => {
            const { codigo } = req.params
            existeOr404(await model.eliminar(codigo), noExiste(codigo))
            res.status(200).json({ codigo })
        }
    }
}

module.exports = crearControladorNodos
