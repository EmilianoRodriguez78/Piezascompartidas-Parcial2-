require('dotenv').config({ quiet: true })
const path = require('path')
const express = require('express')
const { conectarDB, cerrarDB } = require('./config/db')
const { ENTIDADES, RELACIONES } = require('./config/esquema')
const { crearNodosModel, crearRestricciones } = require('./models/nodosModel')
const crearRelacionModel = require('./models/relacionesModel')
const crearControladorNodos = require('./controllers/nodosController')
const crearControladorRelacion = require('./controllers/relacionesController')
const crearRutasNodos = require('./routes/nodosRoutes')
const crearRutasRelacion = require('./routes/relacionesRoutes')
const { rutaNoEncontrada, errorHandler } = require('./middleware/errorMiddleware')

const port = process.env.PORT || 5000

const app = express()
app.use(express.json())

// Frontend (HTML, CSS y JS) en http://localhost:5000
app.use(express.static(path.join(__dirname, '..', 'public')))

// El frontend arma sus formularios a partir del mismo esquema que el backend
app.get('/api/esquema', (req, res) => res.json({ ENTIDADES, RELACIONES }))

// CRUD de nodos: /api/marcas, /api/modelos, /api/piezas, ...
for (const [ruta, entidad] of Object.entries(ENTIDADES)) {
    const model = crearNodosModel(entidad.etiqueta)
    app.use(`/api/${ruta}`, crearRutasNodos(crearControladorNodos(entidad, model)))
}

// Relaciones: /api/relaciones/CONTIENE, /api/relaciones/SURTE, ...
for (const [tipo, relacion] of Object.entries(RELACIONES)) {
    const model = crearRelacionModel(tipo, relacion)
    app.use(`/api/relaciones/${tipo}`, crearRutasRelacion(crearControladorRelacion(tipo, relacion, model)))
}

// Consultas especializadas del grafo
app.use('/api/consultas', require('./routes/consultasRoutes'))

app.use(rutaNoEncontrada)
app.use(errorHandler)

// Las restricciones se aseguran al arrancar: así no dependen de haber corrido el seed
conectarDB()
    .then(crearRestricciones)
    .then(() => app.listen(port, () => console.log(`Servidor iniciado en el puerto ${port}`)))
    .catch((error) => {
        console.error('No se pudo iniciar el servidor:', error.message)
        process.exit(1)
    })

process.on('SIGINT', async () => {
    await cerrarDB()
    process.exit(0)
})
