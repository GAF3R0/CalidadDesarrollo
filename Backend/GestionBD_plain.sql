--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: actualizar_estados_cirugias(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_estados_cirugias() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Marcar cirugías pasadas como completadas
    UPDATE cirugias 
    SET estado = 'completada', actualizado_en = CURRENT_TIMESTAMP
    WHERE fecha < CURRENT_DATE 
    AND estado = 'programada';
    
    -- Marcar cirugías de hoy como en_proceso si es horario laboral
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


ALTER FUNCTION public.actualizar_estados_cirugias() OWNER TO postgres;

--
-- Name: FUNCTION actualizar_estados_cirugias(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.actualizar_estados_cirugias() IS 'Función para actualizar estados de cirugías automáticamente. 
Ejecutar diariamente mediante job programado.';


--
-- Name: auditoria_cirugias(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auditoria_cirugias() RETURNS trigger
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


ALTER FUNCTION public.auditoria_cirugias() OWNER TO postgres;

--
-- Name: auditoria_expedientes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auditoria_expedientes() RETURNS trigger
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


ALTER FUNCTION public.auditoria_expedientes() OWNER TO postgres;

--
-- Name: auditoria_medicos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auditoria_medicos() RETURNS trigger
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


ALTER FUNCTION public.auditoria_medicos() OWNER TO postgres;

--
-- Name: auditoria_pacientes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auditoria_pacientes() RETURNS trigger
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


ALTER FUNCTION public.auditoria_pacientes() OWNER TO postgres;

--
-- Name: generar_reporte_mensual(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generar_reporte_mensual(p_mes integer, p_anio integer) RETURNS TABLE(especialidad character varying, total_cirugias bigint, promedio_duracion interval, medico_mas_activo character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.descripcion as especialidad,
        COUNT(DISTINCT c.id_cirugia) as total_cirugias,
        AVG(h.hora_fin - h.hora_inicio) as promedio_duracion,
        (SELECT m2.nombre || ' ' || m2.apellido_paterno 
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


ALTER FUNCTION public.generar_reporte_mensual(p_mes integer, p_anio integer) OWNER TO postgres;

--
-- Name: obtener_estadisticas_cirugias(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.obtener_estadisticas_cirugias(p_fecha_inicio date DEFAULT NULL::date, p_fecha_fin date DEFAULT NULL::date) RETURNS TABLE(total_cirugias bigint, cirugias_programadas bigint, cirugias_completadas bigint, promedio_duracion interval, quirofano_mas_utilizado character varying)
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
         JOIN cirugias c2 ON q.id_quirófano = c2.id_quirófano
         WHERE (p_fecha_inicio IS NULL OR c2.fecha >= p_fecha_inicio)
         AND (p_fecha_fin IS NULL OR c2.fecha <= p_fecha_fin)
         GROUP BY q.sala ORDER BY COUNT(*) DESC LIMIT 1) as quirofano_mas_utilizado
    FROM cirugias c
    LEFT JOIN horarios h ON c.id_cirugia = h.id_cirugia
    WHERE (p_fecha_inicio IS NULL OR c.fecha >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR c.fecha <= p_fecha_fin);
END;
$$;


ALTER FUNCTION public.obtener_estadisticas_cirugias(p_fecha_inicio date, p_fecha_fin date) OWNER TO postgres;

--
-- Name: programar_cirugia_completa(integer, character varying, integer, integer, date, time without time zone, time without time zone, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.programar_cirugia_completa(p_id_paciente integer, p_numero_expediente character varying, p_id_quirofano integer, p_id_equipo_medico integer, p_fecha_cirugia date, p_hora_inicio time without time zone, p_hora_fin time without time zone, p_procedimiento text, p_usuario character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_expediente INTEGER;
    v_id_cirugia INTEGER;
    v_id_horario INTEGER;
BEGIN
    -- Insertar o obtener expediente
    INSERT INTO expedientes (id_paciente, numero_expediente, fecha_ingreso, creado_por)
    VALUES (p_id_paciente, p_numero_expediente, CURRENT_DATE, p_usuario)
    ON CONFLICT (numero_expediente) DO UPDATE SET
        actualizado_en = CURRENT_TIMESTAMP
    RETURNING id_expediente INTO v_id_expediente;
    
    -- Insertar cirugía
    INSERT INTO cirugias (
        id_expediente, fecha, procedimiento, 
        id_quirófano, id_equipomedico, creado_por
    ) VALUES (
        v_id_expediente, p_fecha_cirugia, p_procedimiento,
        p_id_quirofano, p_id_equipo_medico, p_usuario
    ) RETURNING id_cirugia INTO v_id_cirugia;
    
    -- Insertar horario
    INSERT INTO horarios (
        id_cirugia, hora_inicio, hora_fin
    ) VALUES (
        v_id_cirugia, p_hora_inicio, p_hora_fin
    ) RETURNING id_horario INTO v_id_horario;
    
    -- Registrar en auditoría
    INSERT INTO log_auditoria (tabla_afectada, accion, id_registro, usuario)
    VALUES ('cirugias', 'INSERT', v_id_cirugia, p_usuario);
    
    RETURN v_id_cirugia;
END;
$$;


ALTER FUNCTION public.programar_cirugia_completa(p_id_paciente integer, p_numero_expediente character varying, p_id_quirofano integer, p_id_equipo_medico integer, p_fecha_cirugia date, p_hora_inicio time without time zone, p_hora_fin time without time zone, p_procedimiento text, p_usuario character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cirugias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cirugias (
    id_cirugia integer NOT NULL,
    id_expediente integer,
    fecha date,
    diagnostico_pre text,
    diagnostico_post text,
    procedimiento text,
    resultado text,
    "id_quirófano" integer,
    id_equipomedico integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'programada'::character varying,
    creado_por character varying(50)
);


ALTER TABLE public.cirugias OWNER TO postgres;

--
-- Name: cirugias_id_cirugia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cirugias_id_cirugia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cirugias_id_cirugia_seq OWNER TO postgres;

--
-- Name: cirugias_id_cirugia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cirugias_id_cirugia_seq OWNED BY public.cirugias.id_cirugia;


--
-- Name: configuracion_sistema; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion_sistema (
    id_config integer NOT NULL,
    clave character varying(100) NOT NULL,
    valor text,
    descripcion character varying(255),
    activo boolean DEFAULT true
);


ALTER TABLE public.configuracion_sistema OWNER TO postgres;

--
-- Name: configuracion_sistema_id_config_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.configuracion_sistema_id_config_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracion_sistema_id_config_seq OWNER TO postgres;

--
-- Name: configuracion_sistema_id_config_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.configuracion_sistema_id_config_seq OWNED BY public.configuracion_sistema.id_config;


--
-- Name: equipo_medico; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipo_medico (
    id_equipomedico integer NOT NULL,
    nombre character varying(150) NOT NULL,
    id_medico integer
);


ALTER TABLE public.equipo_medico OWNER TO postgres;

--
-- Name: equipo_medico_id_equipomedico_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.equipo_medico_id_equipomedico_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.equipo_medico_id_equipomedico_seq OWNER TO postgres;

--
-- Name: equipo_medico_id_equipomedico_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.equipo_medico_id_equipomedico_seq OWNED BY public.equipo_medico.id_equipomedico;


--
-- Name: especialidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.especialidades (
    id_especialidad integer NOT NULL,
    descripcion character varying(50) NOT NULL
);


ALTER TABLE public.especialidades OWNER TO postgres;

--
-- Name: especialidades_id_especialidad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.especialidades_id_especialidad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.especialidades_id_especialidad_seq OWNER TO postgres;

--
-- Name: especialidades_id_especialidad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_id_especialidad_seq OWNED BY public.especialidades.id_especialidad;


--
-- Name: expedientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expedientes (
    id_expediente integer NOT NULL,
    id_paciente integer,
    numero_expediente character varying(50),
    fecha_ingreso date,
    procedencia character varying(100),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por character varying(50),
    activo boolean DEFAULT true
);


ALTER TABLE public.expedientes OWNER TO postgres;

--
-- Name: expedientes_id_expediente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expedientes_id_expediente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expedientes_id_expediente_seq OWNER TO postgres;

--
-- Name: expedientes_id_expediente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expedientes_id_expediente_seq OWNED BY public.expedientes.id_expediente;


--
-- Name: horarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.horarios (
    id_horario integer NOT NULL,
    id_cirugia integer,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    hora_recuperacion time without time zone,
    hora_egreso time without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.horarios OWNER TO postgres;

--
-- Name: horarios_id_horario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.horarios_id_horario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.horarios_id_horario_seq OWNER TO postgres;

--
-- Name: horarios_id_horario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.horarios_id_horario_seq OWNED BY public.horarios.id_horario;


--
-- Name: log_auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_auditoria (
    id_log integer NOT NULL,
    tabla_afectada character varying(50),
    accion character varying(20),
    id_registro integer,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    usuario character varying(50),
    fecha_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.log_auditoria OWNER TO postgres;

--
-- Name: log_auditoria_id_log_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_auditoria_id_log_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_auditoria_id_log_seq OWNER TO postgres;

--
-- Name: log_auditoria_id_log_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_auditoria_id_log_seq OWNED BY public.log_auditoria.id_log;


--
-- Name: medicos_usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medicos_usuarios (
    id_medicos integer NOT NULL,
    nombre character varying(45) NOT NULL,
    apellido_paterno character varying(45) NOT NULL,
    apellido_materno character varying(45),
    cedula_profecional character varying(15) NOT NULL,
    telefono character varying(20),
    id_rol integer,
    id_especialidad integer,
    password character varying(60),
    foto_perfil character varying(255),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultimo_login timestamp without time zone,
    activo boolean DEFAULT true
);


ALTER TABLE public.medicos_usuarios OWNER TO postgres;

--
-- Name: medicos_usuarios_id_medicos_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medicos_usuarios_id_medicos_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicos_usuarios_id_medicos_seq OWNER TO postgres;

--
-- Name: medicos_usuarios_id_medicos_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medicos_usuarios_id_medicos_seq OWNED BY public.medicos_usuarios.id_medicos;


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificaciones (
    id_notificacion integer NOT NULL,
    id_usuario integer,
    tipo character varying(50),
    titulo character varying(200),
    mensaje text,
    leida boolean DEFAULT false,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_leida timestamp without time zone
);


ALTER TABLE public.notificaciones OWNER TO postgres;

--
-- Name: notificaciones_id_notificacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificaciones_id_notificacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificaciones_id_notificacion_seq OWNER TO postgres;

--
-- Name: notificaciones_id_notificacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificaciones_id_notificacion_seq OWNED BY public.notificaciones.id_notificacion;


--
-- Name: pacientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pacientes (
    id_paciente integer NOT NULL,
    nombre character varying(150) NOT NULL,
    apellido character varying(150),
    sexo character varying(20) NOT NULL,
    fecha_nacimiento date,
    tipo_sangre character varying(20),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por character varying(50),
    activo boolean DEFAULT true
);


ALTER TABLE public.pacientes OWNER TO postgres;

--
-- Name: pacientes_id_paciente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pacientes_id_paciente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pacientes_id_paciente_seq OWNER TO postgres;

--
-- Name: pacientes_id_paciente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pacientes_id_paciente_seq OWNED BY public.pacientes.id_paciente;


--
-- Name: quirofanos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quirofanos (
    "id_quirófano" integer NOT NULL,
    sala character varying(50),
    estado character varying(100)
);


ALTER TABLE public.quirofanos OWNER TO postgres;

--
-- Name: quirofanos_id_quirófano_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."quirofanos_id_quirófano_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."quirofanos_id_quirófano_seq" OWNER TO postgres;

--
-- Name: quirofanos_id_quirófano_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."quirofanos_id_quirófano_seq" OWNED BY public.quirofanos."id_quirófano";


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    descripcion character varying(45) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO postgres;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- Name: vista_dashboard_medico; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_dashboard_medico AS
 SELECT m.id_medicos,
    (((m.nombre)::text || ' '::text) || (m.apellido_paterno)::text) AS medico,
    e.descripcion AS especialidad,
    count(DISTINCT c.id_cirugia) AS total_cirugias,
    count(DISTINCT
        CASE
            WHEN (c.fecha >= (CURRENT_DATE - '30 days'::interval)) THEN c.id_cirugia
            ELSE NULL::integer
        END) AS cirugias_30_dias,
    count(DISTINCT em.id_equipomedico) AS equipos_asignados
   FROM (((public.medicos_usuarios m
     LEFT JOIN public.especialidades e ON ((m.id_especialidad = e.id_especialidad)))
     LEFT JOIN public.equipo_medico em ON ((m.id_medicos = em.id_medico)))
     LEFT JOIN public.cirugias c ON ((em.id_equipomedico = c.id_equipomedico)))
  WHERE (m.activo = true)
  GROUP BY m.id_medicos, m.nombre, m.apellido_paterno, e.descripcion;


ALTER VIEW public.vista_dashboard_medico OWNER TO postgres;

--
-- Name: vista_programacion_quirofanos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_programacion_quirofanos AS
 SELECT c.id_cirugia,
    (((p.nombre)::text || ' '::text) || (p.apellido)::text) AS paciente,
    c.fecha,
    h.hora_inicio,
    h.hora_fin,
    q.sala,
    q.estado AS division_quirurgica,
    (((m.nombre)::text || ' '::text) || (m.apellido_paterno)::text) AS medico_principal,
    c.estado
   FROM ((((((public.cirugias c
     JOIN public.expedientes exp ON ((c.id_expediente = exp.id_expediente)))
     JOIN public.pacientes p ON ((exp.id_paciente = p.id_paciente)))
     JOIN public.horarios h ON ((c.id_cirugia = h.id_cirugia)))
     JOIN public.quirofanos q ON ((c."id_quirófano" = q."id_quirófano")))
     JOIN public.equipo_medico em ON ((c.id_equipomedico = em.id_equipomedico)))
     JOIN public.medicos_usuarios m ON ((em.id_medico = m.id_medicos)))
  WHERE (c.fecha >= CURRENT_DATE)
  ORDER BY c.fecha, h.hora_inicio;


ALTER VIEW public.vista_programacion_quirofanos OWNER TO postgres;

--
-- Name: cirugias id_cirugia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias ALTER COLUMN id_cirugia SET DEFAULT nextval('public.cirugias_id_cirugia_seq'::regclass);


--
-- Name: configuracion_sistema id_config; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_sistema ALTER COLUMN id_config SET DEFAULT nextval('public.configuracion_sistema_id_config_seq'::regclass);


--
-- Name: equipo_medico id_equipomedico; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_medico ALTER COLUMN id_equipomedico SET DEFAULT nextval('public.equipo_medico_id_equipomedico_seq'::regclass);


--
-- Name: especialidades id_especialidad; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades ALTER COLUMN id_especialidad SET DEFAULT nextval('public.especialidades_id_especialidad_seq'::regclass);


--
-- Name: expedientes id_expediente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expedientes ALTER COLUMN id_expediente SET DEFAULT nextval('public.expedientes_id_expediente_seq'::regclass);


--
-- Name: horarios id_horario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios ALTER COLUMN id_horario SET DEFAULT nextval('public.horarios_id_horario_seq'::regclass);


--
-- Name: log_auditoria id_log; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_auditoria ALTER COLUMN id_log SET DEFAULT nextval('public.log_auditoria_id_log_seq'::regclass);


--
-- Name: medicos_usuarios id_medicos; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos_usuarios ALTER COLUMN id_medicos SET DEFAULT nextval('public.medicos_usuarios_id_medicos_seq'::regclass);


--
-- Name: notificaciones id_notificacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id_notificacion SET DEFAULT nextval('public.notificaciones_id_notificacion_seq'::regclass);


--
-- Name: pacientes id_paciente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes ALTER COLUMN id_paciente SET DEFAULT nextval('public.pacientes_id_paciente_seq'::regclass);


--
-- Name: quirofanos id_quirófano; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quirofanos ALTER COLUMN "id_quirófano" SET DEFAULT nextval('public."quirofanos_id_quirófano_seq"'::regclass);


--
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- Name: cirugias cirugias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias
    ADD CONSTRAINT cirugias_pkey PRIMARY KEY (id_cirugia);


--
-- Name: configuracion_sistema configuracion_sistema_clave_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_sistema
    ADD CONSTRAINT configuracion_sistema_clave_key UNIQUE (clave);


--
-- Name: configuracion_sistema configuracion_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_sistema
    ADD CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (id_config);


--
-- Name: equipo_medico equipo_medico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_medico
    ADD CONSTRAINT equipo_medico_pkey PRIMARY KEY (id_equipomedico);


--
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (id_especialidad);


--
-- Name: expedientes expedientes_numero_expediente_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_numero_expediente_key UNIQUE (numero_expediente);


--
-- Name: expedientes expedientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_pkey PRIMARY KEY (id_expediente);


--
-- Name: horarios horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id_horario);


--
-- Name: log_auditoria log_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_auditoria
    ADD CONSTRAINT log_auditoria_pkey PRIMARY KEY (id_log);


--
-- Name: medicos_usuarios medicos_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos_usuarios
    ADD CONSTRAINT medicos_usuarios_pkey PRIMARY KEY (id_medicos);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id_notificacion);


--
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id_paciente);


--
-- Name: quirofanos quirofanos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quirofanos
    ADD CONSTRAINT quirofanos_pkey PRIMARY KEY ("id_quirófano");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: idx_cirugias_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cirugias_estado ON public.cirugias USING btree (estado);


--
-- Name: idx_cirugias_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cirugias_fecha ON public.cirugias USING btree (fecha);


--
-- Name: idx_cirugias_quirofano; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cirugias_quirofano ON public.cirugias USING btree ("id_quirófano");


--
-- Name: idx_expedientes_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expedientes_paciente ON public.expedientes USING btree (id_paciente);


--
-- Name: idx_horarios_cirugia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_horarios_cirugia ON public.horarios USING btree (id_cirugia);


--
-- Name: idx_log_auditoria_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_auditoria_fecha ON public.log_auditoria USING btree (fecha_hora);


--
-- Name: idx_medicos_especialidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medicos_especialidad ON public.medicos_usuarios USING btree (id_especialidad);


--
-- Name: idx_notificaciones_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_usuario ON public.notificaciones USING btree (id_usuario);


--
-- Name: cirugias tr_auditoria_cirugias; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_auditoria_cirugias AFTER INSERT OR DELETE OR UPDATE ON public.cirugias FOR EACH ROW EXECUTE FUNCTION public.auditoria_cirugias();


--
-- Name: expedientes tr_auditoria_expedientes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_auditoria_expedientes AFTER INSERT OR DELETE OR UPDATE ON public.expedientes FOR EACH ROW EXECUTE FUNCTION public.auditoria_expedientes();


--
-- Name: medicos_usuarios tr_auditoria_medicos_usuarios; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_auditoria_medicos_usuarios AFTER INSERT OR DELETE OR UPDATE ON public.medicos_usuarios FOR EACH ROW EXECUTE FUNCTION public.auditoria_medicos();


--
-- Name: pacientes tr_auditoria_pacientes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_auditoria_pacientes AFTER INSERT OR DELETE OR UPDATE ON public.pacientes FOR EACH ROW EXECUTE FUNCTION public.auditoria_pacientes();


--
-- Name: cirugias cirugias_id_equipomedico_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias
    ADD CONSTRAINT cirugias_id_equipomedico_fkey FOREIGN KEY (id_equipomedico) REFERENCES public.equipo_medico(id_equipomedico);


--
-- Name: cirugias cirugias_id_expediente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias
    ADD CONSTRAINT cirugias_id_expediente_fkey FOREIGN KEY (id_expediente) REFERENCES public.expedientes(id_expediente);


--
-- Name: cirugias cirugias_id_quirófano_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias
    ADD CONSTRAINT "cirugias_id_quirófano_fkey" FOREIGN KEY ("id_quirófano") REFERENCES public.quirofanos("id_quirófano");


--
-- Name: equipo_medico equipo_medico_id_medico_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_medico
    ADD CONSTRAINT equipo_medico_id_medico_fkey FOREIGN KEY (id_medico) REFERENCES public.medicos_usuarios(id_medicos);


--
-- Name: expedientes expedientes_id_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_id_paciente_fkey FOREIGN KEY (id_paciente) REFERENCES public.pacientes(id_paciente);


--
-- Name: cirugias fk_cirugias_equipo_medico; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias
    ADD CONSTRAINT fk_cirugias_equipo_medico FOREIGN KEY (id_equipomedico) REFERENCES public.equipo_medico(id_equipomedico);


--
-- Name: cirugias fk_cirugias_expedientes; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias
    ADD CONSTRAINT fk_cirugias_expedientes FOREIGN KEY (id_expediente) REFERENCES public.expedientes(id_expediente);


--
-- Name: cirugias fk_cirugias_quirofanos; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cirugias
    ADD CONSTRAINT fk_cirugias_quirofanos FOREIGN KEY ("id_quirófano") REFERENCES public.quirofanos("id_quirófano");


--
-- Name: equipo_medico fk_equipo_medico_medicos; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipo_medico
    ADD CONSTRAINT fk_equipo_medico_medicos FOREIGN KEY (id_medico) REFERENCES public.medicos_usuarios(id_medicos);


--
-- Name: expedientes fk_expedientes_pacientes; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT fk_expedientes_pacientes FOREIGN KEY (id_paciente) REFERENCES public.pacientes(id_paciente);


--
-- Name: horarios fk_horarios_cirugias; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT fk_horarios_cirugias FOREIGN KEY (id_cirugia) REFERENCES public.cirugias(id_cirugia);


--
-- Name: medicos_usuarios fk_medicos_especialidades; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos_usuarios
    ADD CONSTRAINT fk_medicos_especialidades FOREIGN KEY (id_especialidad) REFERENCES public.especialidades(id_especialidad);


--
-- Name: medicos_usuarios fk_medicos_roles; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos_usuarios
    ADD CONSTRAINT fk_medicos_roles FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


--
-- Name: horarios horarios_id_cirugia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_id_cirugia_fkey FOREIGN KEY (id_cirugia) REFERENCES public.cirugias(id_cirugia);


--
-- Name: medicos_usuarios medicos_usuarios_id_especialidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos_usuarios
    ADD CONSTRAINT medicos_usuarios_id_especialidad_fkey FOREIGN KEY (id_especialidad) REFERENCES public.especialidades(id_especialidad);


--
-- Name: medicos_usuarios medicos_usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos_usuarios
    ADD CONSTRAINT medicos_usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


--
-- PostgreSQL database dump complete
--

