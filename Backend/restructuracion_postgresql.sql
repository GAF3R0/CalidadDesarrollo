-- =============================================================================
-- PROYECTO: HOSPITAL ABMODEL - TESIS CALIDAD DE DESARROLLO
-- SCRIPT DE REESTRUCTURACIÓN Y CALIDAD PARA POSTGRESQL (pgAdmin 4)
-- =============================================================================
-- Base de Datos: Gestion
-- Motor: PostgreSQL 14+ / 16+
-- Objetivo: Eliminar redundancias de llaves foráneas, blindar unicidad legal,
--           garantizar integridad referencial en cascada, validar dominios clínicos
--           y optimizar índices para prevención de conflictos de quirófano.
-- =============================================================================

BEGIN; -- Inicia bloque transaccional seguro (si ocurre un error, nada se aplica)

-- -----------------------------------------------------------------------------
-- SECCIÓN 1: ELIMINACIÓN DE LLAVES FORÁNEAS DUPLICADAS (LIMPIEZA DE CATÁLOGO)
-- -----------------------------------------------------------------------------
-- Justificación: Cada relación foránea fue creada dos veces con distintos nombres,
-- duplicando innecesariamente el consumo de CPU y memoria en cada INSERT/UPDATE/DELETE.
-- Dejamos activa la nomenclatura estándar 'fk_<tabla_origen>_<tabla_destino>'.

ALTER TABLE expedientes 
  DROP CONSTRAINT IF EXISTS expedientes_id_paciente_fkey;

ALTER TABLE medicos_usuarios 
  DROP CONSTRAINT IF EXISTS medicos_usuarios_id_especialidad_fkey,
  DROP CONSTRAINT IF EXISTS medicos_usuarios_id_rol_fkey;

ALTER TABLE equipo_medico 
  DROP CONSTRAINT IF EXISTS equipo_medico_id_medico_fkey;

ALTER TABLE cirugias 
  DROP CONSTRAINT IF EXISTS cirugias_id_equipomedico_fkey,
  DROP CONSTRAINT IF EXISTS cirugias_id_expediente_fkey,
  DROP CONSTRAINT IF EXISTS cirugias_id_quirófano_fkey;

ALTER TABLE horarios 
  DROP CONSTRAINT IF EXISTS horarios_id_cirugia_fkey;


-- -----------------------------------------------------------------------------
-- SECCIÓN 2: BLINDAJE DE IDENTIDAD Y UNICIDAD (RESTRICCIONES UNIQUE)
-- -----------------------------------------------------------------------------
-- 2.1 Cédula Profesional Única: Evita duplicidad de identidad de médicos en el hospital.
ALTER TABLE medicos_usuarios 
  ADD CONSTRAINT uq_medicos_cedula UNIQUE (cedula_profecional);

-- 2.2 Nombres de Sala Únicos: Evita que existan dos salas llamadas igual (ej. dos "Sala 1").
ALTER TABLE quirofanos 
  ADD CONSTRAINT uq_quirofanos_sala UNIQUE (sala);


-- -----------------------------------------------------------------------------
-- SECCIÓN 3: INTEGRIDAD REFERENCIAL DEPENDIENTE (ON DELETE CASCADE)
-- -----------------------------------------------------------------------------
-- Justificación: La tabla 'horarios' es un detalle débil que depende 100% de 'cirugias'.
-- Si una cirugía es eliminada, sus horarios deben eliminarse automáticamente sin
-- arrojar errores 23503 por clave foránea.

ALTER TABLE horarios 
  DROP CONSTRAINT IF EXISTS fk_horarios_cirugias;

ALTER TABLE horarios 
  ADD CONSTRAINT fk_horarios_cirugias 
  FOREIGN KEY (id_cirugia) REFERENCES cirugias(id_cirugia) ON DELETE CASCADE;


-- -----------------------------------------------------------------------------
-- SECCIÓN 4: REGLAS DE DOMINIO CLÍNICO (CHECK CONSTRAINTS)
-- -----------------------------------------------------------------------------
-- 4.1 Sexo y Tipo de Sangre: Garantiza valores médicos válidos y normalizados.
ALTER TABLE pacientes
  ADD CONSTRAINT chk_pacientes_sexo 
    CHECK (sexo IN ('Masculino', 'Femenino', 'Otro')),
  ADD CONSTRAINT chk_pacientes_sangre 
    CHECK (tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- 4.2 Estado de Quirófano: Solo permite estados operativos reconocidos.
ALTER TABLE quirofanos
  ADD CONSTRAINT chk_quirofanos_estado 
    CHECK (LOWER(estado) IN ('disponible', 'ocupado', 'mantenimiento'));

-- 4.3 Estados Clínicos de Cirugía: Protege la semántica del flujo quirúrgico.
ALTER TABLE cirugias
  ADD CONSTRAINT chk_cirugias_estado 
    CHECK (LOWER(estado) IN ('programada', 'en_proceso', 'en proceso', 'completada', 'cancelada', 'baja', 'medio', 'emergencia'));


-- -----------------------------------------------------------------------------
-- SECCIÓN 5: OPTIMIZACIÓN DE RENDIMIENTO (ÍNDICES B-TREE COMPUESTOS)
-- -----------------------------------------------------------------------------
-- 5.1 Índice compuesto para acelerar la validación de choques/solapamientos de horario en quirófano:
CREATE INDEX IF NOT EXISTS idx_cirugias_quirofano_fecha 
  ON cirugias ("id_quirófano", fecha);

-- 5.2 Índice para acelerar filtros por estado en vistas y reportes:
CREATE INDEX IF NOT EXISTS idx_cirugias_estado 
  ON cirugias (estado);


COMMIT; -- Aplica todos los cambios de forma atómica y permanente

-- Verificación final
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type 
FROM information_schema.table_constraints tc 
WHERE tc.table_schema = 'public' 
ORDER BY tc.table_name, tc.constraint_type;
