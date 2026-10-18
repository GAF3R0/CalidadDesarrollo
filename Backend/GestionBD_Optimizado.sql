-- =============================================================================
-- BASE DE DATOS: Gestion (OPTIMIZADA Y REESTRUCTURADA PARA POSTGRESQL)
-- Motor: PostgreSQL 14+ / 16+ / 17+ (Compatible con pgAdmin 4)
-- Tesis: Calidad de Desarrollo - Hospital ABMODEL
-- =============================================================================

DROP DATABASE IF EXISTS "Gestion";
CREATE DATABASE "Gestion" WITH ENCODING = 'UTF8';

\c "Gestion";

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- -----------------------------------------------------------------------------
-- 1. FUNCIONES Y PROCEDIMIENTOS ALMACENADOS (PL/pgSQL)
-- -----------------------------------------------------------------------------

-- 1.1 Función para actualización automática de estados
CREATE OR REPLACE FUNCTION public.actualizar_estados_cirugias() 
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Marcar cirugías de fechas pasadas como completadas
    UPDATE cirugias 
    SET estado = 'completada', actualizado_en = CURRENT_TIMESTAMP
    WHERE fecha < CURRENT_DATE 
    AND estado = 'programada';
    
    -- Marcar cirugías de hoy como en_proceso si coincide el horario
    UPDATE cirugias 
    SET estado = 'en_proceso', actualizado_en = CURRENT_TIMESTAMP
    WHERE fecha = CURRENT_DATE 
    AND estado = 'programada'
    AND EXISTS (
        SELECT 1 FROM horarios h 
        WHERE h.id_cirugia = cirugias.id_cirugia 
        AND h.hora_inicio <= CURRENT_TIME 
        AND h.hora_fin >= CURRENT_TIME
    );
END;
$$;

-- 1.2 Triggers de Auditoría JSONB
CREATE OR REPLACE FUNCTION public.auditoria_cirugias() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_nuevos, usuario)
        VALUES ('cirugias', 'INSERT', NEW.id_cirugia, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.actualizado_en := CURRENT_TIMESTAMP;
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, datos_nuevos, usuario)
        VALUES ('cirugias', 'UPDATE', NEW.id_cirugia, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, usuario)
        VALUES ('cirugias', 'DELETE', OLD.id_cirugia, row_to_json(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.auditoria_expedientes() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_nuevos, usuario)
        VALUES ('expedientes', 'INSERT', NEW.id_expediente, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.actualizado_en := CURRENT_TIMESTAMP;
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, datos_nuevos, usuario)
        VALUES ('expedientes', 'UPDATE', NEW.id_expediente, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, usuario)
        VALUES ('expedientes', 'DELETE', OLD.id_expediente, row_to_json(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.auditoria_medicos() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_nuevos, usuario)
        VALUES ('medicos_usuarios', 'INSERT', NEW.id_medicos, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.actualizado_en := CURRENT_TIMESTAMP;
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, datos_nuevos, usuario)
        VALUES ('medicos_usuarios', 'UPDATE', NEW.id_medicos, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, usuario)
        VALUES ('medicos_usuarios', 'DELETE', OLD.id_medicos, row_to_json(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.auditoria_pacientes() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_nuevos, usuario)
        VALUES ('pacientes', 'INSERT', NEW.id_paciente, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.actualizado_en := CURRENT_TIMESTAMP;
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, datos_nuevos, usuario)
        VALUES ('pacientes', 'UPDATE', NEW.id_paciente, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, datos_anteriores, usuario)
        VALUES ('pacientes', 'DELETE', OLD.id_paciente, row_to_json(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 1.3 Procedimientos de Reportes y Estadísticas Clínicas
CREATE OR REPLACE FUNCTION public.generar_reporte_mensual(p_mes integer, p_anio integer) 
RETURNS TABLE(especialidad character varying, total_cirugias bigint, promedio_duracion interval, medico_mas_activo character varying)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.descripcion as especialidad,
        COUNT(DISTINCT c.id_cirugia) as total_cirugias,
        AVG(h.hora_fin - h.hora_inicio) as promedio_duracion,
        (SELECT (m2.nombre || ' ' || m2.apellido_paterno)::character varying 
         FROM medicos_usuarios m2 
         JOIN equipo_medico em2 ON m2.id_medicos = em2.id_medico
         JOIN cirugias c2 ON em2.id_equipomedico = c2.id_equipomedico
         WHERE m2.id_especialidad = e.id_especialidad
         AND EXTRACT(MONTH FROM c2.fecha) = p_mes
         AND EXTRACT(YEAR FROM c2.fecha) = p_anio
         GROUP BY m2.id_medicos, m2.nombre, m2.apellido_paterno
         ORDER BY COUNT(*) DESC LIMIT 1) as medico_mas_activo
    FROM especialidades e
    LEFT JOIN medicos_usuarios m ON e.id_especialidad = m.id_especialidad
    LEFT JOIN equipo_medico em ON m.id_medicos = em.id_medico
    LEFT JOIN cirugias c ON em.id_equipomedico = c.id_equipomedico
    LEFT JOIN horarios h ON c.id_cirugia = h.id_cirugia
    WHERE EXTRACT(MONTH FROM c.fecha) = p_mes
    AND EXTRACT(YEAR FROM c.fecha) = p_anio
    GROUP BY e.id_especialidad, e.descripcion
    ORDER BY total_cirugias DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.obtener_estadisticas_cirugias(p_fecha_inicio date DEFAULT NULL::date, p_fecha_fin date DEFAULT NULL::date) 
RETURNS TABLE(total_cirugias bigint, cirugias_programadas bigint, cirugias_completadas bigint, promedio_duracion interval, quirofano_mas_utilizado character varying)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_cirugias,
        COUNT(CASE WHEN c.estado = 'programada' THEN 1 END) as cirugias_programadas,
        COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as cirugias_completadas,
        AVG(h.hora_fin - h.hora_inicio) as promedio_duracion,
        (SELECT q.sala FROM quirofanos q 
         JOIN cirugias c2 ON q."id_quirófano" = c2."id_quirófano"
         WHERE (p_fecha_inicio IS NULL OR c2.fecha >= p_fecha_inicio)
         AND (p_fecha_fin IS NULL OR c2.fecha <= p_fecha_fin)
         GROUP BY q.sala ORDER BY COUNT(*) DESC LIMIT 1) as quirofano_mas_utilizado
    FROM cirugias c
    LEFT JOIN horarios h ON c.id_cirugia = h.id_cirugia
    WHERE (p_fecha_inicio IS NULL OR c.fecha >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR c.fecha <= p_fecha_fin);
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. TABLAS BASE CON RESTRICCIONES Y CHECKS
-- -----------------------------------------------------------------------------

CREATE TABLE public.roles (
    id_rol SERIAL PRIMARY KEY,
    descripcion character varying(50) NOT NULL
);

CREATE TABLE public.especialidades (
    id_especialidad SERIAL PRIMARY KEY,
    descripcion character varying(100) NOT NULL
);

CREATE TABLE public.medicos_usuarios (
    id_medicos SERIAL PRIMARY KEY,
    nombre character varying(100) NOT NULL,
    apellido_paterno character varying(100) NOT NULL,
    apellido_materno character varying(100),
    cedula_profecional character varying(50) NOT NULL,
    telefono character varying(20),
    id_rol integer REFERENCES public.roles(id_rol),
    id_especialidad integer REFERENCES public.especialidades(id_especialidad),
    password character varying(255),
    foto_perfil character varying(255),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultimo_login timestamp without time zone,
    activo boolean DEFAULT true,
    CONSTRAINT uq_medicos_cedula UNIQUE (cedula_profecional)
);

CREATE TABLE public.pacientes (
    id_paciente SERIAL PRIMARY KEY,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    sexo character varying(20) NOT NULL,
    fecha_nacimiento date,
    tipo_sangre character varying(10),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por character varying(50),
    activo boolean DEFAULT true,
    CONSTRAINT chk_pacientes_sexo CHECK (sexo IN ('Masculino', 'Femenino', 'Otro')),
    CONSTRAINT chk_pacientes_sangre CHECK (tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);

CREATE TABLE public.expedientes (
    id_expediente SERIAL PRIMARY KEY,
    id_paciente integer REFERENCES public.pacientes(id_paciente),
    numero_expediente character varying(50) NOT NULL UNIQUE,
    fecha_ingreso date DEFAULT CURRENT_DATE,
    procedencia character varying(100),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por character varying(50),
    activo boolean DEFAULT true
);

CREATE TABLE public.quirofanos (
    "id_quirófano" SERIAL PRIMARY KEY,
    sala character varying(50) NOT NULL UNIQUE,
    estado character varying(20) DEFAULT 'disponible',
    CONSTRAINT chk_quirofanos_estado CHECK (LOWER(estado) IN ('disponible', 'ocupado', 'mantenimiento'))
);

CREATE TABLE public.equipo_medico (
    id_equipomedico SERIAL PRIMARY KEY,
    nombre character varying(100) NOT NULL,
    id_medico integer REFERENCES public.medicos_usuarios(id_medicos)
);

CREATE TABLE public.cirugias (
    id_cirugia SERIAL PRIMARY KEY,
    id_expediente integer REFERENCES public.expedientes(id_expediente),
    fecha date NOT NULL,
    diagnostico_pre text,
    diagnostico_post text,
    procedimiento text NOT NULL,
    resultado text,
    "id_quirófano" integer REFERENCES public.quirofanos("id_quirófano"),
    id_equipomedico integer REFERENCES public.equipo_medico(id_equipomedico),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'programada',
    creado_por character varying(50),
    CONSTRAINT chk_cirugias_estado CHECK (LOWER(estado) IN ('programada', 'en_proceso', 'en proceso', 'completada', 'cancelada', 'baja', 'medio', 'emergencia'))
);

CREATE TABLE public.horarios (
    id_horario SERIAL PRIMARY KEY,
    id_cirugia integer REFERENCES public.cirugias(id_cirugia) ON DELETE CASCADE,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    hora_recuperacion time without time zone,
    hora_egreso time without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.log_auditoria (
    id_log SERIAL PRIMARY KEY,
    tabla_afectada character varying(50),
    accion character varying(20),
    id_registro integer,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    usuario character varying(50),
    fecha_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.configuracion_sistema (
    id_config SERIAL PRIMARY KEY,
    clave character varying(100) NOT NULL UNIQUE,
    valor text,
    descripcion character varying(255),
    activo boolean DEFAULT true
);

CREATE TABLE public.notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario integer REFERENCES public.medicos_usuarios(id_medicos),
    tipo character varying(50),
    titulo character varying(100),
    mensaje text,
    leida boolean DEFAULT false,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_leida timestamp without time zone
);

-- -----------------------------------------------------------------------------
-- 3. VISTAS DEL SISTEMA
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.vista_dashboard_medico AS
SELECT 
    m.id_medicos,
    (m.nombre || ' ' || m.apellido_paterno) AS medico,
    e.descripcion AS especialidad,
    COUNT(DISTINCT c.id_cirugia) AS total_cirugias,
    COUNT(DISTINCT CASE WHEN c.fecha >= (CURRENT_DATE - INTERVAL '30 days') THEN c.id_cirugia END) AS cirugias_30_dias,
    COUNT(DISTINCT em.id_equipomedico) AS equipos_asignados
FROM medicos_usuarios m
LEFT JOIN especialidades e ON m.id_especialidad = e.id_especialidad
LEFT JOIN equipo_medico em ON m.id_medicos = em.id_medico
LEFT JOIN cirugias c ON em.id_equipomedico = c.id_equipomedico
WHERE m.activo = true
GROUP BY m.id_medicos, m.nombre, m.apellido_paterno, e.descripcion;

CREATE OR REPLACE VIEW public.vista_programacion_quirofanos AS
SELECT 
    c.id_cirugia,
    (p.nombre || ' ' || p.apellido) AS paciente,
    c.fecha,
    h.hora_inicio,
    h.hora_fin,
    q.sala,
    q.estado AS division_quirurgica,
    (m.nombre || ' ' || m.apellido_paterno) AS medico_principal,
    c.estado
FROM cirugias c
JOIN expedientes exp ON c.id_expediente = exp.id_expediente
JOIN pacientes p ON exp.id_paciente = p.id_paciente
JOIN horarios h ON c.id_cirugia = h.id_cirugia
JOIN quirofanos q ON c."id_quirófano" = q."id_quirófano"
JOIN equipo_medico em ON c.id_equipomedico = em.id_equipomedico
JOIN medicos_usuarios m ON em.id_medico = m.id_medicos
WHERE c.fecha >= CURRENT_DATE
ORDER BY c.fecha, h.hora_inicio;

-- -----------------------------------------------------------------------------
-- 4. ÍNDICES B-TREE DE ALTO RENDIMIENTO
-- -----------------------------------------------------------------------------

CREATE INDEX idx_expedientes_paciente ON public.expedientes (id_paciente);
CREATE INDEX idx_horarios_cirugia ON public.horarios (id_cirugia);
CREATE INDEX idx_medicos_especialidad ON public.medicos_usuarios (id_especialidad);
CREATE INDEX idx_cirugias_quirofano_fecha ON public.cirugias ("id_quirófano", fecha);
CREATE INDEX idx_cirugias_estado ON public.cirugias (estado);
CREATE INDEX idx_log_auditoria_fecha ON public.log_auditoria (fecha_hora);
CREATE INDEX idx_notificaciones_usuario ON public.notificaciones (id_usuario);

-- -----------------------------------------------------------------------------
-- 5. TRIGGERS DE AUDITORÍA AUTOMÁTICA
-- -----------------------------------------------------------------------------

CREATE TRIGGER tr_auditoria_cirugias 
AFTER INSERT OR DELETE OR UPDATE ON public.cirugias 
FOR EACH ROW EXECUTE FUNCTION public.auditoria_cirugias();

CREATE TRIGGER tr_auditoria_expedientes 
AFTER INSERT OR DELETE OR UPDATE ON public.expedientes 
FOR EACH ROW EXECUTE FUNCTION public.auditoria_expedientes();

CREATE TRIGGER tr_auditoria_medicos_usuarios 
AFTER INSERT OR DELETE OR UPDATE ON public.medicos_usuarios 
FOR EACH ROW EXECUTE FUNCTION public.auditoria_medicos();

CREATE TRIGGER tr_auditoria_pacientes 
AFTER INSERT OR DELETE OR UPDATE ON public.pacientes 
FOR EACH ROW EXECUTE FUNCTION public.auditoria_pacientes();

-- -----------------------------------------------------------------------------
-- 6. DATOS INICIALES SEMILLA (ROLES, ESPECIALIDADES Y CONFIGURACIÓN)
-- -----------------------------------------------------------------------------

INSERT INTO public.roles (descripcion) VALUES 
('Administrador'),
('Especialista'),
('Enfermero'),
('Instrumentista');

INSERT INTO public.especialidades (descripcion) VALUES 
('Cirugía General'),
('Traumatología'),
('Cardiología'),
('Neurocirugía'),
('Anestesiología'),
('Pediatría');

INSERT INTO public.configuracion_sistema (clave, valor, descripcion, activo) VALUES 
('tiempo_maximo_cirugia', '08:00:00', 'Duración máxima permitida para una cirugía', true),
('horario_inicio_quirofano', '07:00:00', 'Hora de inicio de actividades en quirófanos', true),
('horario_fin_quirofano', '20:00:00', 'Hora de fin de actividades en quirófanos', true),
('dias_antelacion_reserva', '30', 'Días máximos de antelación para reservar quirófano', true),
('email_notificaciones', 'notificaciones@hospital.com', 'Email para envío de notificaciones', true);
