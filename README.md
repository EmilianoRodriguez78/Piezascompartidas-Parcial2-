# Piezas compartidas entre marcas (Express + Neo4j AuraDB)

API REST en Node.js y Express conectada a una base de datos de grafos **Neo4j AuraDB** (en la nube) mediante el driver oficial `neo4j-driver`, con un frontend web sencillo (HTML, CSS y JavaScript) que sirve el mismo servidor.

Modela un grupo automotriz ficticio, **Apex Group** (marcas Noir, Ghost y Vela), y permite:

| Función | Tipo | Endpoints |
|---|---|---|
| Administrar el catálogo | CRUD | `/api/<entidad>` y `/api/relaciones/<TIPO>` |
| Analizar impacto | Recorrido | `/api/consultas/impacto/...` |
| Buscar reutilización | Recorrido | `/api/consultas/reutilizacion/:codigo`, `/api/consultas/piezas-compartidas` |
| Detectar riesgo | Agregación | `/api/consultas/riesgo/...` |

Todos los datos son sintéticos.

## Requisitos

* **Node.js** 18 o superior
* Una instancia de **Neo4j AuraDB** (la capa Free sirve). La base no se ejecuta en localhost: el backend sí puede correr en tu equipo.

Dependencias: `express` (servidor), `neo4j-driver` (driver oficial de Neo4j), `dotenv` (variables de entorno) y `nodemon` (solo desarrollo).

## Instalación

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` como `.env` y llénalo con el archivo de credenciales que descargaste al crear la instancia de AuraDB:
   ```
   PORT=5000
   NODE_ENV=development
   NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
   NEO4J_USER=tu_usuario
   NEO4J_PASSWORD=tu_contrasenia
   ```
   El usuario es el que aparece en el archivo de credenciales (en las instancias nuevas es el ID de la instancia, no `neo4j`).
3. (Opcional) Carga los datos iniciales. **Ojo: borra todo el grafo** antes de cargar los datos:
   ```bash
   npm run seed
   ```
   Al terminar muestra 49 nodos (1 Grupo, 3 Marca, 3 Plataforma, 7 Modelo, 11 Ensamble, 18 Pieza, 6 Proveedor) y 99 relaciones (BASE_DE 7, CONTIENE 25, FABRICA 7, SURTE 22, TIENE_MARCA 3, USA 35).
4. Levanta el servidor:
   ```bash
   npm run server      # desarrollo, con nodemon
   npm start           # sin nodemon
   ```
5. Abre `http://localhost:5000` en el navegador para usar el frontend.

Al arrancar, el servidor crea (si no existen) las restricciones de unicidad de `codigo` en cada etiqueta, así que la API rechaza códigos repetidos aunque los datos se hayan cargado sin `npm run seed`.

## Modelo de grafo

```
(Grupo)-[:TIENE_MARCA]->(Marca)-[:FABRICA]->(Modelo)<-[:BASE_DE]-(Plataforma)
(Modelo)-[:USA]->(Ensamble)-[:CONTIENE {cantidad}]->(Ensamble | Pieza)
(Proveedor)-[:SURTE {costo_unitario, dias_entrega}]->(Pieza)
```

| Etiqueta | Propiedades |
|---|---|
| Grupo | codigo (único), nombre, pais |
| Marca | codigo (único), nombre, segmento |
| Plataforma | codigo (único), nombre, tipo_propulsion |
| Modelo | codigo (único), nombre, anio_inicio, carroceria |
| Ensamble | codigo (único), nombre, categoria |
| Pieza | codigo (único), nombre, categoria, critica |
| Proveedor | codigo (único), nombre, pais, calificacion |

`TIENE_MARCA`, `FABRICA` y `BASE_DE` son **únicas**: una marca pertenece a un solo grupo, y un modelo tiene una sola marca y una sola plataforma. Asignar otra reemplaza a la anterior.

El modelo completo está definido en un solo lugar, [`backend/config/esquema.js`](backend/config/esquema.js). Las rutas, la validación y el seeding se generan a partir de él.

## Frontend

Está en `public/` y no usa frameworks ni compilación: Express lo sirve en `http://localhost:5000`, así que no hace falta otro servidor ni configurar CORS. El navegador solo habla con la API, nunca con Neo4j.

* **Catálogo**: una sección por entidad, con tabla, formulario para crear o editar y botón para eliminar. Las relaciones se capturan en el mismo formulario del nodo y aparecen como columnas en la tabla:

  | Formulario | Relaciones que incluye |
  |---|---|
  | Marca | Grupo al que pertenece |
  | Modelo | Marca, Plataforma y ensambles que usa |
  | Ensamble | Componentes (piezas o subensambles) con su cantidad |
  | Proveedor | Piezas que surte, con costo y días de entrega |

* **Consultas**: las consultas especializadas, cada una con su selector y su tabla de resultados.

Los formularios se generan a partir de `GET /api/esquema`, que devuelve el mismo `esquema.js` del backend. Las relaciones únicas aparecen como un selector en el formulario del destino; las demás, como una lista de filas en el formulario del origen.

## Endpoints

### CRUD de nodos

`<entidad>` es una de: `grupos`, `marcas`, `plataformas`, `modelos`, `ensambles`, `piezas`, `proveedores`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/<entidad>` | Lista todos |
| GET | `/api/<entidad>/:codigo` | Obtiene uno |
| POST | `/api/<entidad>` | Crea (`codigo` y `nombre` obligatorios) |
| PUT | `/api/<entidad>/:codigo` | Actualiza propiedades (el `codigo` no se cambia) |
| DELETE | `/api/<entidad>/:codigo` | Elimina el nodo y sus relaciones |

Solo se guardan las propiedades del modelo; el resto del body se ignora.

```bash
curl -X POST http://localhost:5000/api/piezas -H "Content-Type: application/json" -d "{\"codigo\":\"PZ-FARO\",\"nombre\":\"Faro LED\",\"categoria\":\"electrica\",\"critica\":false}"
```

### Relaciones

`<TIPO>` es una de: `TIENE_MARCA`, `FABRICA`, `BASE_DE`, `USA`, `CONTIENE`, `SURTE`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/relaciones/<TIPO>` | Lista las relaciones de ese tipo |
| PUT | `/api/relaciones/<TIPO>/:origen/:destino` | Crea la relación o actualiza sus propiedades (en las únicas, reemplaza la anterior del destino) |
| DELETE | `/api/relaciones/<TIPO>/:origen/:destino` | Elimina la relación |

```bash
# Asignar un ensamble a un modelo
curl -X PUT http://localhost:5000/api/relaciones/USA/MOD-VE/ENS-SUSP-NEUM

# Un proveedor surte una pieza (con propiedades en la relación)
curl -X PUT http://localhost:5000/api/relaciones/SURTE/PRV-STAHL/PZ-INFLADOR -H "Content-Type: application/json" -d "{\"costo_unitario\":44,\"dias_entrega\":25}"

# Cambiar el proveedor de una pieza = quitar la relación anterior y crear la nueva
curl -X DELETE http://localhost:5000/api/relaciones/SURTE/PRV-KOGANE/PZ-INFLADOR
```

### Consultas especializadas

| Ruta | Pregunta que responde |
|---|---|
| GET `/api/consultas/impacto/proveedor/:codigo` | Si falla este proveedor, ¿qué marcas y modelos se afectan? |
| GET `/api/consultas/impacto/pieza/:codigo` | Si falla esta pieza, ¿qué marcas y modelos se afectan? |
| GET `/api/consultas/reutilizacion/:codigo` | ¿Qué ensambles de otras marcas sobre la misma plataforma puede adoptar este modelo? |
| GET `/api/consultas/piezas-compartidas` | ¿Qué piezas se usan en más de una marca? |
| GET `/api/consultas/riesgo/proveedor-unico` | ¿Qué piezas dependen de un solo proveedor? (críticas primero) |
| GET `/api/consultas/riesgo/modelo-unico` | ¿Qué piezas usa un solo modelo? (candidatas a estandarizar) |
| GET `/api/consultas/resumen` | Conteo de nodos y relaciones |

Resultados esperados con los datos del seeding:

* `impacto/proveedor/PRV-KOGANE`: 3 marcas (Ghost, Noir, Vela) con todos sus modelos y 3 piezas afectadas cada una. Es el caso Takata en miniatura.
* `reutilizacion/MOD-VE`: Infoentretenimiento de lujo y Suspensión neumática, de Ghost Halo.
* `piezas-compartidas`: 15 piezas (12 en las 3 marcas, 3 en 2 marcas).
* `riesgo/proveedor-unico`: 14 piezas; las 5 críticas aparecen primero.
* `riesgo/modelo-unico`: Compresor de aire y Fuelle neumático (Ghost Halo).

Las consultas Cypher están en [`backend/models/consultasModel.js`](backend/models/consultasModel.js).

### Errores

Cuando algo falla, la API responde el código HTTP, su significado y el detalle. El frontend muestra los tres en el aviso rojo.

```json
{ "status": 409, "significado": "Conflicto: la operación choca con datos que ya existen", "message": "Ya existe un nodo con ese codigo" }
```

| Código | Significado | Ejemplo |
|---|---|---|
| 400 | Solicitud incorrecta: los datos enviados no son válidos | Crear sin `codigo` o sin `nombre`, o con un JSON mal escrito |
| 404 | No encontrado: el registro o la ruta no existe | Editar o eliminar un `codigo` que no existe |
| 409 | Conflicto: la operación choca con datos que ya existen | Crear un nodo con un `codigo` que ya está en uso |
| 500 | Error interno del servidor | Neo4j no responde (por ejemplo, la instancia está pausada) |

## Estructura

```
backend/
  server.js                    arranque: arma rutas → controladores → modelos a partir del esquema,
                               sirve el frontend, conecta a Neo4j y levanta Express
  config/
    db.js                      driver de Neo4j y función ejecutar(cypher, params)
    esquema.js                 etiquetas, propiedades y relaciones del grafo
    seed.js                    carga inicial (npm run seed)
    datos.js                   datos sintéticos
  models/                      única capa que contiene Cypher
    nodosModel.js              CRUD genérico por etiqueta y restricciones de unicidad
    relacionesModel.js         alta/baja genérica por tipo de relación
    consultasModel.js          consultas especializadas
  controllers/                 validación y respuesta HTTP
  routes/                      definición de endpoints
  middleware/
    errorMiddleware.js         404, manejo de errores (409 si el codigo ya existe) y HttpError
public/                        frontend
  index.html                   pestañas Catálogo y Consultas
  styles.css
  app.js                       llamadas a la API y formularios generados a partir del esquema
```

Neo4j no tiene esquemas como Mongoose: en `models/` en lugar de esquemas hay funciones que ejecutan Cypher.

## Errores comunes

* **ServiceUnavailable / Could not perform discovery**: URI mal copiada, o la instancia Free de AuraDB está pausada (se reanuda desde console.neo4j.io).
* **Unauthorized**: usuario o contraseña incorrectos en `.env`.
