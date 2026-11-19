// Datos sintéticos de Apex Group (marcas Noir, Ghost y Vela). Ninguno corresponde a empresas reales.
// Armados para que cada consulta especializada devuelva resultados:
//  - Impacto: Kogane Safety surte inflador, módulo y sensor de la bolsa de aire → afecta las 3 marcas.
//  - Reutilización: Vela E y Ghost Halo comparten la Plataforma EV.
//  - Piezas con un solo proveedor: 14 (inflador, módulo, caliper, celda y BMS son críticas).
//  - Piezas de un solo modelo: fuelle y compresor (solo Ghost Halo).
// Totales: 49 nodos y 99 relaciones.

const nodos = {
    grupos: [
        { codigo: 'GRP-APEX', nombre: 'Apex Group', pais: 'Alemania' }
    ],
    marcas: [
        { codigo: 'MRC-Noir',  nombre: 'Noir',  segmento: 'premium' },
        { codigo: 'MRC-Ghost', nombre: 'Ghost', segmento: 'ultragama' },
        { codigo: 'MRC-Vela',  nombre: 'Vela',  segmento: 'compacto' }
    ],
    plataformas: [
        { codigo: 'PLT-MODULAR', nombre: 'Plataforma Modular', tipo_propulsion: 'combustion' },
        { codigo: 'PLT-LUX',     nombre: 'Plataforma Lux',     tipo_propulsion: 'combustion' },
        { codigo: 'PLT-EV',      nombre: 'Plataforma EV',      tipo_propulsion: 'electrica' }
    ],
    modelos: [
        { codigo: 'MOD-N3',  nombre: 'Noir N3',       anio_inicio: 2021, carroceria: 'sedan' },
        { codigo: 'MOD-N5',  nombre: 'Noir N5',       anio_inicio: 2022, carroceria: 'SUV' },
        { codigo: 'MOD-NX1', nombre: 'Noir NX1',      anio_inicio: 2023, carroceria: 'coupe' },
        { codigo: 'MOD-GE',  nombre: 'Ghost Eclipse', anio_inicio: 2022, carroceria: 'sedan' },
        { codigo: 'MOD-GH',  nombre: 'Ghost Halo',    anio_inicio: 2024, carroceria: 'SUV' },
        { codigo: 'MOD-V1',  nombre: 'Vela One',      anio_inicio: 2021, carroceria: 'hatchback' },
        { codigo: 'MOD-VE',  nombre: 'Vela E',        anio_inicio: 2024, carroceria: 'hatchback' }
    ],
    ensambles: [
        { codigo: 'ENS-AIRBAG',    nombre: 'Sistema de bolsa de aire',    categoria: 'seguridad' },
        { codigo: 'ENS-FRENOS',    nombre: 'Sistema de frenos',           categoria: 'seguridad' },
        { codigo: 'ENS-MOTOR-4C',  nombre: 'Motor 4 cilindros turbo',     categoria: 'tren motriz' },
        { codigo: 'ENS-MOTOR-V8',  nombre: 'Motor V8 biturbo',            categoria: 'tren motriz' },
        { codigo: 'ENS-TURBO',     nombre: 'Turbocompresor',              categoria: 'tren motriz' },
        { codigo: 'ENS-BOMBA',     nombre: 'Bomba de aceite',             categoria: 'tren motriz' },
        { codigo: 'ENS-BATERIA',   nombre: 'Paquete de baterias',         categoria: 'tren motriz' },
        { codigo: 'ENS-SUSP',      nombre: 'Suspension convencional',     categoria: 'chasis' },
        { codigo: 'ENS-SUSP-NEU',  nombre: 'Suspension neumatica',        categoria: 'chasis' },
        { codigo: 'ENS-INFO',      nombre: 'Infoentretenimiento',         categoria: 'electronica' },
        { codigo: 'ENS-INFO-LUJO', nombre: 'Infoentretenimiento de lujo', categoria: 'electronica' }
    ],
    piezas: [
        { codigo: 'PZ-INFLADOR',     nombre: 'Inflador',                categoria: 'pirotecnia',  critica: true },
        { codigo: 'PZ-MODULO',       nombre: 'Modulo de bolsa de aire', categoria: 'textil',      critica: true },
        { codigo: 'PZ-SENSOR',       nombre: 'Sensor de impacto',       categoria: 'electronica', critica: true },
        { codigo: 'PZ-PASTILLA',     nombre: 'Pastilla de freno',       categoria: 'friccion',    critica: true },
        { codigo: 'PZ-DISCO',        nombre: 'Disco de freno',          categoria: 'metalica',    critica: true },
        { codigo: 'PZ-CALIPER',      nombre: 'Caliper',                 categoria: 'metalica',    critica: true },
        { codigo: 'PZ-PISTON',       nombre: 'Piston',                  categoria: 'metalica',    critica: false },
        { codigo: 'PZ-BUJIA',        nombre: 'Bujia',                   categoria: 'electrica',   critica: false },
        { codigo: 'PZ-TURBINA',      nombre: 'Turbina',                 categoria: 'metalica',    critica: false },
        { codigo: 'PZ-ENGRANE',      nombre: 'Engrane de bomba',        categoria: 'metalica',    critica: false },
        { codigo: 'PZ-AMORTIGUADOR', nombre: 'Amortiguador',            categoria: 'hidraulica',  critica: false },
        { codigo: 'PZ-CHIP',         nombre: 'Chip de procesamiento',   categoria: 'electronica', critica: false },
        { codigo: 'PZ-PANTALLA',     nombre: 'Pantalla LCD',            categoria: 'electronica', critica: false },
        { codigo: 'PZ-AMPLIFICADOR', nombre: 'Amplificador de audio',   categoria: 'electronica', critica: false },
        { codigo: 'PZ-CELDA',        nombre: 'Celda de bateria',        categoria: 'quimica',     critica: true },
        { codigo: 'PZ-BMS',          nombre: 'Controlador BMS',         categoria: 'electronica', critica: true },
        { codigo: 'PZ-FUELLE',       nombre: 'Fuelle neumatico',        categoria: 'neumatica',   critica: false },
        { codigo: 'PZ-COMPRESOR',    nombre: 'Compresor de aire',       categoria: 'neumatica',   critica: false }
    ],
    proveedores: [
        { codigo: 'PRV-KOGANE',   nombre: 'Kogane Safety',      pais: 'Japon',         calificacion: 3.1 },
        { codigo: 'PRV-BREMEX',   nombre: 'Bremex',             pais: 'Mexico',        calificacion: 4.5 },
        { codigo: 'PRV-TORQ',     nombre: 'Torq Parts',         pais: 'EE. UU.',       calificacion: 3.9 },
        { codigo: 'PRV-VOLTA',    nombre: 'Volta Cells',        pais: 'Corea del Sur', calificacion: 4.3 },
        { codigo: 'PRV-LUMINA',   nombre: 'Lumina Electronics', pais: 'Taiwan',        calificacion: 4.1 },
        { codigo: 'PRV-HARTMANN', nombre: 'Hartmann Teile',     pais: 'Alemania',      calificacion: 4.6 }
    ]
}

// [origen, destino, propiedades de la relación]
const relaciones = {
    TIENE_MARCA: [
        ['GRP-APEX', 'MRC-Noir'], ['GRP-APEX', 'MRC-Ghost'], ['GRP-APEX', 'MRC-Vela']
    ],
    FABRICA: [
        ['MRC-Noir', 'MOD-N3'], ['MRC-Noir', 'MOD-N5'], ['MRC-Noir', 'MOD-NX1'],
        ['MRC-Ghost', 'MOD-GE'], ['MRC-Ghost', 'MOD-GH'],
        ['MRC-Vela', 'MOD-V1'], ['MRC-Vela', 'MOD-VE']
    ],
    BASE_DE: [
        ['PLT-MODULAR', 'MOD-N3'], ['PLT-MODULAR', 'MOD-N5'], ['PLT-MODULAR', 'MOD-V1'],
        ['PLT-LUX', 'MOD-NX1'], ['PLT-LUX', 'MOD-GE'],
        ['PLT-EV', 'MOD-GH'], ['PLT-EV', 'MOD-VE']
    ],
    USA: [
        ['MOD-N3', 'ENS-AIRBAG'], ['MOD-N3', 'ENS-FRENOS'], ['MOD-N3', 'ENS-MOTOR-4C'], ['MOD-N3', 'ENS-SUSP'], ['MOD-N3', 'ENS-INFO'],
        ['MOD-N5', 'ENS-AIRBAG'], ['MOD-N5', 'ENS-FRENOS'], ['MOD-N5', 'ENS-MOTOR-4C'], ['MOD-N5', 'ENS-SUSP'], ['MOD-N5', 'ENS-INFO'],
        ['MOD-NX1', 'ENS-AIRBAG'], ['MOD-NX1', 'ENS-FRENOS'], ['MOD-NX1', 'ENS-MOTOR-V8'], ['MOD-NX1', 'ENS-SUSP'], ['MOD-NX1', 'ENS-INFO'],
        ['MOD-GE', 'ENS-AIRBAG'], ['MOD-GE', 'ENS-FRENOS'], ['MOD-GE', 'ENS-MOTOR-V8'], ['MOD-GE', 'ENS-SUSP'], ['MOD-GE', 'ENS-INFO-LUJO'],
        ['MOD-GH', 'ENS-AIRBAG'], ['MOD-GH', 'ENS-FRENOS'], ['MOD-GH', 'ENS-BATERIA'], ['MOD-GH', 'ENS-SUSP-NEU'], ['MOD-GH', 'ENS-INFO-LUJO'],
        ['MOD-V1', 'ENS-AIRBAG'], ['MOD-V1', 'ENS-FRENOS'], ['MOD-V1', 'ENS-MOTOR-4C'], ['MOD-V1', 'ENS-SUSP'], ['MOD-V1', 'ENS-INFO'],
        ['MOD-VE', 'ENS-AIRBAG'], ['MOD-VE', 'ENS-FRENOS'], ['MOD-VE', 'ENS-BATERIA'], ['MOD-VE', 'ENS-SUSP'], ['MOD-VE', 'ENS-INFO']
    ],
    CONTIENE: [
        ['ENS-AIRBAG', 'PZ-INFLADOR', { cantidad: 1 }],
        ['ENS-AIRBAG', 'PZ-MODULO', { cantidad: 1 }],
        ['ENS-AIRBAG', 'PZ-SENSOR', { cantidad: 2 }],
        ['ENS-FRENOS', 'PZ-PASTILLA', { cantidad: 8 }],
        ['ENS-FRENOS', 'PZ-DISCO', { cantidad: 4 }],
        ['ENS-FRENOS', 'PZ-CALIPER', { cantidad: 4 }],
        ['ENS-MOTOR-4C', 'PZ-PISTON', { cantidad: 4 }],
        ['ENS-MOTOR-4C', 'PZ-BUJIA', { cantidad: 4 }],
        ['ENS-MOTOR-4C', 'ENS-TURBO', { cantidad: 1 }],   // subensamble
        ['ENS-MOTOR-4C', 'ENS-BOMBA', { cantidad: 1 }],   // subensamble
        ['ENS-MOTOR-V8', 'PZ-PISTON', { cantidad: 8 }],
        ['ENS-MOTOR-V8', 'PZ-BUJIA', { cantidad: 8 }],
        ['ENS-MOTOR-V8', 'ENS-TURBO', { cantidad: 2 }],   // subensamble
        ['ENS-MOTOR-V8', 'ENS-BOMBA', { cantidad: 1 }],   // subensamble
        ['ENS-TURBO', 'PZ-TURBINA', { cantidad: 1 }],
        ['ENS-BOMBA', 'PZ-ENGRANE', { cantidad: 2 }],
        ['ENS-BATERIA', 'PZ-CELDA', { cantidad: 96 }],
        ['ENS-BATERIA', 'PZ-BMS', { cantidad: 1 }],
        ['ENS-SUSP', 'PZ-AMORTIGUADOR', { cantidad: 4 }],
        ['ENS-SUSP-NEU', 'PZ-FUELLE', { cantidad: 4 }],
        ['ENS-SUSP-NEU', 'PZ-COMPRESOR', { cantidad: 1 }],
        ['ENS-INFO', 'PZ-CHIP', { cantidad: 1 }],
        ['ENS-INFO', 'PZ-PANTALLA', { cantidad: 1 }],
        ['ENS-INFO-LUJO', 'PZ-CHIP', { cantidad: 2 }],
        ['ENS-INFO-LUJO', 'PZ-AMPLIFICADOR', { cantidad: 1 }]
    ],
    SURTE: [
        ['PRV-KOGANE', 'PZ-INFLADOR', { costo_unitario: 45.0, dias_entrega: 30 }],
        ['PRV-KOGANE', 'PZ-MODULO', { costo_unitario: 60.0, dias_entrega: 30 }],
        ['PRV-KOGANE', 'PZ-SENSOR', { costo_unitario: 18.5, dias_entrega: 20 }],
        ['PRV-BREMEX', 'PZ-CALIPER', { costo_unitario: 75.0, dias_entrega: 10 }],
        ['PRV-BREMEX', 'PZ-PASTILLA', { costo_unitario: 12.5, dias_entrega: 7 }],
        ['PRV-BREMEX', 'PZ-DISCO', { costo_unitario: 40.0, dias_entrega: 10 }],
        ['PRV-TORQ', 'PZ-PASTILLA', { costo_unitario: 11.9, dias_entrega: 14 }],
        ['PRV-TORQ', 'PZ-DISCO', { costo_unitario: 38.0, dias_entrega: 14 }],
        ['PRV-TORQ', 'PZ-BUJIA', { costo_unitario: 4.2, dias_entrega: 7 }],
        ['PRV-TORQ', 'PZ-PISTON', { costo_unitario: 22.0, dias_entrega: 21 }],
        ['PRV-TORQ', 'PZ-TURBINA', { costo_unitario: 310.0, dias_entrega: 35 }],
        ['PRV-TORQ', 'PZ-ENGRANE', { costo_unitario: 9.8, dias_entrega: 12 }],
        ['PRV-VOLTA', 'PZ-CELDA', { costo_unitario: 6.5, dias_entrega: 45 }],
        ['PRV-VOLTA', 'PZ-BMS', { costo_unitario: 220.0, dias_entrega: 40 }],
        ['PRV-LUMINA', 'PZ-CHIP', { costo_unitario: 85.0, dias_entrega: 28 }],
        ['PRV-LUMINA', 'PZ-PANTALLA', { costo_unitario: 140.0, dias_entrega: 21 }],
        ['PRV-LUMINA', 'PZ-AMPLIFICADOR', { costo_unitario: 95.0, dias_entrega: 21 }],
        ['PRV-LUMINA', 'PZ-SENSOR', { costo_unitario: 17.0, dias_entrega: 25 }],
        ['PRV-HARTMANN', 'PZ-AMORTIGUADOR', { costo_unitario: 55.0, dias_entrega: 10 }],
        ['PRV-HARTMANN', 'PZ-FUELLE', { costo_unitario: 70.0, dias_entrega: 18 }],
        ['PRV-HARTMANN', 'PZ-COMPRESOR', { costo_unitario: 260.0, dias_entrega: 25 }],
        ['PRV-HARTMANN', 'PZ-BUJIA', { costo_unitario: 4.5, dias_entrega: 5 }]
    ]
}

module.exports = { nodos, relaciones }
