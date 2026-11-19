// Datos sintéticos de Apex Group (marcas Noir, Ghost y Vela). Ninguno corresponde a empresas reales.
// Son los mismos datos del script seed_apex.cypher, en el formato que usa npm run seed.
// Armados para que cada consulta especializada devuelva resultados:
//  - Impacto: Kogane Safety surte inflador, módulo y sensor de la bolsa de aire → afecta las 3 marcas.
//  - Reutilización: Vela E y Ghost Halo comparten la Plataforma EV.
//  - Piezas con un solo proveedor: 14 (caliper, celda, BMS, inflador y módulo son críticas).
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
        { codigo: 'PLT-RWD', nombre: 'Plataforma RWD', tipo_propulsion: 'combustion' },
        { codigo: 'PLT-FWD', nombre: 'Plataforma FWD', tipo_propulsion: 'combustion' },
        { codigo: 'PLT-EV',  nombre: 'Plataforma EV',  tipo_propulsion: 'electrica' }
    ],
    modelos: [
        { codigo: 'MOD-N3',      nombre: 'Noir N3',       anio_inicio: 2021, carroceria: 'sedan' },
        { codigo: 'MOD-N5',      nombre: 'Noir N5',       anio_inicio: 2022, carroceria: 'sedan' },
        { codigo: 'MOD-NX1',     nombre: 'Noir NX1',      anio_inicio: 2023, carroceria: 'SUV' },
        { codigo: 'MOD-ECLIPSE', nombre: 'Ghost Eclipse', anio_inicio: 2022, carroceria: 'sedan' },
        { codigo: 'MOD-HALO',    nombre: 'Ghost Halo',    anio_inicio: 2025, carroceria: 'coupe' },
        { codigo: 'MOD-V1',      nombre: 'Vela One',      anio_inicio: 2023, carroceria: 'hatchback' },
        { codigo: 'MOD-VE',      nombre: 'Vela E',        anio_inicio: 2025, carroceria: 'hatchback' }
    ],
    ensambles: [
        { codigo: 'ENS-AIRBAG',    nombre: 'Sistema de bolsa de aire',     categoria: 'seguridad' },
        { codigo: 'ENS-FRENOS',    nombre: 'Sistema de frenos',            categoria: 'seguridad' },
        { codigo: 'ENS-MOTOR-3C',  nombre: 'Motor 3 cilindros',            categoria: 'tren motriz' },
        { codigo: 'ENS-MOTOR-6C',  nombre: 'Motor 6 cilindros',            categoria: 'tren motriz' },
        { codigo: 'ENS-TURBO',     nombre: 'Turbocompresor',               categoria: 'tren motriz' },
        { codigo: 'ENS-BOMBA',     nombre: 'Bomba de aceite',              categoria: 'tren motriz' },
        { codigo: 'ENS-BATERIA',   nombre: 'Paquete de baterías',          categoria: 'electrico' },
        { codigo: 'ENS-SUSP',      nombre: 'Suspensión convencional',      categoria: 'chasis' },
        { codigo: 'ENS-SUSP-NEUM', nombre: 'Suspensión neumática',         categoria: 'chasis' },
        { codigo: 'ENS-INFO',      nombre: 'Infoentretenimiento estándar', categoria: 'electronica' },
        { codigo: 'ENS-INFO-LUX',  nombre: 'Infoentretenimiento de lujo',  categoria: 'electronica' }
    ],
    piezas: [
        { codigo: 'PZ-INFLADOR',       nombre: 'Inflador',                categoria: 'pirotecnia',  critica: true },
        { codigo: 'PZ-MODULO-AIRBAG',  nombre: 'Módulo de bolsa de aire', categoria: 'textil',      critica: true },
        { codigo: 'PZ-SENSOR-IMPACTO', nombre: 'Sensor de impacto',       categoria: 'electronica', critica: true },
        { codigo: 'PZ-PASTILLA',       nombre: 'Pastilla de freno',       categoria: 'friccion',    critica: true },
        { codigo: 'PZ-DISCO',          nombre: 'Disco de freno',          categoria: 'metalica',    critica: true },
        { codigo: 'PZ-CALIPER',        nombre: 'Caliper',                 categoria: 'metalica',    critica: true },
        { codigo: 'PZ-PISTON',         nombre: 'Pistón',                  categoria: 'metalica',    critica: false },
        { codigo: 'PZ-BUJIA',          nombre: 'Bujía',                   categoria: 'electrica',   critica: false },
        { codigo: 'PZ-TURBINA',        nombre: 'Turbina',                 categoria: 'metalica',    critica: false },
        { codigo: 'PZ-ENGRANE-BOMBA',  nombre: 'Engrane de bomba',        categoria: 'metalica',    critica: false },
        { codigo: 'PZ-CELDA',          nombre: 'Celda de batería',        categoria: 'electrica',   critica: true },
        { codigo: 'PZ-BMS',            nombre: 'Controlador BMS',         categoria: 'electronica', critica: true },
        { codigo: 'PZ-AMORTIGUADOR',   nombre: 'Amortiguador',            categoria: 'chasis',      critica: false },
        { codigo: 'PZ-FUELLE-NEUM',    nombre: 'Fuelle neumático',        categoria: 'chasis',      critica: false },
        { codigo: 'PZ-COMPRESOR',      nombre: 'Compresor de aire',       categoria: 'chasis',      critica: false },
        { codigo: 'PZ-PANTALLA',       nombre: 'Pantalla LCD',            categoria: 'electronica', critica: false },
        { codigo: 'PZ-PANTALLA-OLED',  nombre: 'Pantalla OLED',           categoria: 'electronica', critica: false },
        { codigo: 'PZ-CHIP',           nombre: 'Chip procesador',         categoria: 'electronica', critica: false }
    ],
    proveedores: [
        { codigo: 'PRV-KOGANE', nombre: 'Kogane Safety', pais: 'Japón',    calificacion: 4.0 },
        { codigo: 'PRV-BREMEX', nombre: 'Bremex',        pais: 'México',   calificacion: 4.5 },
        { codigo: 'PRV-STAHL',  nombre: 'Stahl Werke',   pais: 'Alemania', calificacion: 4.7 },
        { codigo: 'PRV-VOLTA',  nombre: 'Volta Cells',   pais: 'Corea',    calificacion: 4.3 },
        { codigo: 'PRV-NEXA',   nombre: 'Nexa Semi',     pais: 'Taiwán',   calificacion: 4.1 },
        { codigo: 'PRV-RUEDA',  nombre: 'Rueda Ibérica', pais: 'España',   calificacion: 3.9 }
    ]
}

// [origen, destino, propiedades de la relación]
const relaciones = {
    TIENE_MARCA: [
        ['GRP-APEX', 'MRC-Noir'], ['GRP-APEX', 'MRC-Ghost'], ['GRP-APEX', 'MRC-Vela']
    ],
    FABRICA: [
        ['MRC-Noir', 'MOD-N3'], ['MRC-Noir', 'MOD-N5'], ['MRC-Noir', 'MOD-NX1'],
        ['MRC-Ghost', 'MOD-ECLIPSE'], ['MRC-Ghost', 'MOD-HALO'],
        ['MRC-Vela', 'MOD-V1'], ['MRC-Vela', 'MOD-VE']
    ],
    BASE_DE: [
        ['PLT-RWD', 'MOD-N3'], ['PLT-RWD', 'MOD-N5'], ['PLT-RWD', 'MOD-ECLIPSE'],
        ['PLT-FWD', 'MOD-NX1'], ['PLT-FWD', 'MOD-V1'],
        ['PLT-EV', 'MOD-HALO'], ['PLT-EV', 'MOD-VE']
    ],
    USA: [
        ['MOD-N3', 'ENS-AIRBAG'], ['MOD-N3', 'ENS-FRENOS'], ['MOD-N3', 'ENS-MOTOR-6C'], ['MOD-N3', 'ENS-SUSP'], ['MOD-N3', 'ENS-INFO'],
        ['MOD-N5', 'ENS-AIRBAG'], ['MOD-N5', 'ENS-FRENOS'], ['MOD-N5', 'ENS-MOTOR-6C'], ['MOD-N5', 'ENS-SUSP'], ['MOD-N5', 'ENS-INFO'],
        ['MOD-NX1', 'ENS-AIRBAG'], ['MOD-NX1', 'ENS-FRENOS'], ['MOD-NX1', 'ENS-MOTOR-3C'], ['MOD-NX1', 'ENS-SUSP'], ['MOD-NX1', 'ENS-INFO'],
        ['MOD-ECLIPSE', 'ENS-AIRBAG'], ['MOD-ECLIPSE', 'ENS-FRENOS'], ['MOD-ECLIPSE', 'ENS-MOTOR-6C'], ['MOD-ECLIPSE', 'ENS-SUSP'], ['MOD-ECLIPSE', 'ENS-INFO-LUX'],
        ['MOD-HALO', 'ENS-AIRBAG'], ['MOD-HALO', 'ENS-FRENOS'], ['MOD-HALO', 'ENS-BATERIA'], ['MOD-HALO', 'ENS-SUSP-NEUM'], ['MOD-HALO', 'ENS-INFO-LUX'],
        ['MOD-V1', 'ENS-AIRBAG'], ['MOD-V1', 'ENS-FRENOS'], ['MOD-V1', 'ENS-MOTOR-3C'], ['MOD-V1', 'ENS-SUSP'], ['MOD-V1', 'ENS-INFO'],
        ['MOD-VE', 'ENS-AIRBAG'], ['MOD-VE', 'ENS-FRENOS'], ['MOD-VE', 'ENS-BATERIA'], ['MOD-VE', 'ENS-SUSP'], ['MOD-VE', 'ENS-INFO']
    ],
    CONTIENE: [
        // Subensambles (profundidad variable)
        ['ENS-MOTOR-3C', 'ENS-TURBO', { cantidad: 1 }],
        ['ENS-MOTOR-3C', 'ENS-BOMBA', { cantidad: 1 }],
        ['ENS-MOTOR-6C', 'ENS-TURBO', { cantidad: 2 }],
        ['ENS-MOTOR-6C', 'ENS-BOMBA', { cantidad: 1 }],
        // Piezas
        ['ENS-AIRBAG', 'PZ-INFLADOR', { cantidad: 1 }],
        ['ENS-AIRBAG', 'PZ-MODULO-AIRBAG', { cantidad: 1 }],
        ['ENS-AIRBAG', 'PZ-SENSOR-IMPACTO', { cantidad: 2 }],
        ['ENS-FRENOS', 'PZ-PASTILLA', { cantidad: 8 }],
        ['ENS-FRENOS', 'PZ-DISCO', { cantidad: 4 }],
        ['ENS-FRENOS', 'PZ-CALIPER', { cantidad: 4 }],
        ['ENS-MOTOR-3C', 'PZ-PISTON', { cantidad: 3 }],
        ['ENS-MOTOR-3C', 'PZ-BUJIA', { cantidad: 3 }],
        ['ENS-MOTOR-6C', 'PZ-PISTON', { cantidad: 6 }],
        ['ENS-MOTOR-6C', 'PZ-BUJIA', { cantidad: 6 }],
        ['ENS-TURBO', 'PZ-TURBINA', { cantidad: 1 }],
        ['ENS-BOMBA', 'PZ-ENGRANE-BOMBA', { cantidad: 2 }],
        ['ENS-BATERIA', 'PZ-CELDA', { cantidad: 96 }],
        ['ENS-BATERIA', 'PZ-BMS', { cantidad: 1 }],
        ['ENS-SUSP', 'PZ-AMORTIGUADOR', { cantidad: 4 }],
        ['ENS-SUSP-NEUM', 'PZ-FUELLE-NEUM', { cantidad: 4 }],
        ['ENS-SUSP-NEUM', 'PZ-COMPRESOR', { cantidad: 1 }],
        ['ENS-INFO', 'PZ-PANTALLA', { cantidad: 1 }],
        ['ENS-INFO', 'PZ-CHIP', { cantidad: 2 }],
        ['ENS-INFO-LUX', 'PZ-PANTALLA-OLED', { cantidad: 1 }],
        ['ENS-INFO-LUX', 'PZ-CHIP', { cantidad: 2 }]
    ],
    SURTE: [
        ['PRV-KOGANE', 'PZ-INFLADOR', { costo_unitario: 18.5, dias_entrega: 30 }],
        ['PRV-KOGANE', 'PZ-MODULO-AIRBAG', { costo_unitario: 22.0, dias_entrega: 25 }],
        ['PRV-KOGANE', 'PZ-SENSOR-IMPACTO', { costo_unitario: 6.0, dias_entrega: 20 }],
        ['PRV-BREMEX', 'PZ-PASTILLA', { costo_unitario: 3.2, dias_entrega: 10 }],
        ['PRV-BREMEX', 'PZ-DISCO', { costo_unitario: 12.0, dias_entrega: 12 }],
        ['PRV-BREMEX', 'PZ-CALIPER', { costo_unitario: 35.0, dias_entrega: 15 }],
        ['PRV-STAHL', 'PZ-PASTILLA', { costo_unitario: 3.5, dias_entrega: 14 }],
        ['PRV-STAHL', 'PZ-PISTON', { costo_unitario: 28.0, dias_entrega: 20 }],
        ['PRV-STAHL', 'PZ-BUJIA', { costo_unitario: 2.1, dias_entrega: 7 }],
        ['PRV-STAHL', 'PZ-TURBINA', { costo_unitario: 140.0, dias_entrega: 35 }],
        ['PRV-STAHL', 'PZ-ENGRANE-BOMBA', { costo_unitario: 4.5, dias_entrega: 10 }],
        ['PRV-VOLTA', 'PZ-CELDA', { costo_unitario: 5.8, dias_entrega: 40 }],
        ['PRV-VOLTA', 'PZ-BMS', { costo_unitario: 120.0, dias_entrega: 30 }],
        ['PRV-NEXA', 'PZ-CHIP', { costo_unitario: 9.0, dias_entrega: 45 }],
        ['PRV-NEXA', 'PZ-PANTALLA', { costo_unitario: 85.0, dias_entrega: 30 }],
        ['PRV-NEXA', 'PZ-PANTALLA-OLED', { costo_unitario: 210.0, dias_entrega: 40 }],
        ['PRV-NEXA', 'PZ-SENSOR-IMPACTO', { costo_unitario: 5.5, dias_entrega: 30 }],
        ['PRV-RUEDA', 'PZ-AMORTIGUADOR', { costo_unitario: 45.0, dias_entrega: 12 }],
        ['PRV-RUEDA', 'PZ-FUELLE-NEUM', { costo_unitario: 60.0, dias_entrega: 20 }],
        ['PRV-RUEDA', 'PZ-COMPRESOR', { costo_unitario: 150.0, dias_entrega: 25 }],
        ['PRV-RUEDA', 'PZ-BUJIA', { costo_unitario: 2.0, dias_entrega: 9 }],
        ['PRV-RUEDA', 'PZ-DISCO', { costo_unitario: 11.5, dias_entrega: 15 }]
    ]
}

module.exports = { nodos, relaciones }
