// services/asignacionHorarios.js
import Cirugia from "../models/cirugiaModel.js";
import Quirofano from "../models/quirofanoModel.js";
import EquipoMedico from "../models/equipoMedicoModel.js";
import { Op } from "sequelize";

/**
 * Función para asignar un horario de cirugía validando conflictos
 * @param {Object} data - Datos de la cirugía
 * @param {number} data.id_quirofano
 * @param {number} data.id_equipo_medico
 * @param {number} data.id_paciente
 * @param {string} data.fecha - formato YYYY-MM-DD
 * @param {string} data.hora_inicio - formato HH:mm
 * @param {string} data.hora_fin - formato HH:mm
 */
export async function asignarHorario(data) {
  const { id_quirofano, id_equipo_medico, fecha, hora_inicio, hora_fin } = data;

  // 1️⃣ Verificar que el quirófano exista
  const quir = await Quirofano.findByPk(id_quirofano);
  if (!quir) throw new Error("El quirófano no existe.");

  // 2️⃣ Verificar que el equipo médico exista
  const equipo = await EquipoMedico.findByPk(id_equipo_medico);
  if (!equipo) throw new Error("El equipo médico no existe.");

  // 3️⃣ Buscar cirugías en el mismo quirófano y fecha
  const conflictosQuirofano = await Cirugia.findAll({
    where: {
      id_quirofano,
      fecha,
      [Op.or]: [
        {
          hora_inicio: { [Op.lt]: hora_fin },
          hora_fin: { [Op.gt]: hora_inicio },
        },
      ],
    },
  });

  if (conflictosQuirofano.length > 0) {
    throw new Error("❌ Conflicto: El quirófano ya está ocupado en ese horario.");
  }

  // 4️⃣ Buscar conflictos del equipo médico
  const conflictosEquipo = await Cirugia.findAll({
    where: {
      id_equipo_medico,
      fecha,
      [Op.or]: [
        {
          hora_inicio: { [Op.lt]: hora_fin },
          hora_fin: { [Op.gt]: hora_inicio },
        },
      ],
    },
  });

  if (conflictosEquipo.length > 0) {
    throw new Error("❌ Conflicto: El equipo médico tiene otra cirugía asignada.");
  }

  // 5️⃣ Si no hay conflictos, registrar la cirugía
  const nuevaCirugia = await Cirugia.create(data);
  return {
    mensaje: "✅ Cirugía asignada correctamente",
    cirugia: nuevaCirugia,
  };
}

/**
 * Busca el primer horario disponible en un quirófano
 * considerando cirugías ya registradas
 */
export async function buscarHorarioDisponible(id_quirofano, fecha, duracionMinutos = 120) {
  const inicioJornada = "07:00";
  const finJornada = "19:00";
  const bufferLimpieza = 30; // minutos

  const cirugias = await Cirugia.findAll({
    where: { id_quirofano, fecha },
    order: [["hora_inicio", "ASC"]],
  });

  let horaActual = inicioJornada;

  for (const c of cirugias) {
    const minutosDisponibles = diferenciaMinutos(horaActual, c.hora_inicio);
    if (minutosDisponibles >= duracionMinutos) {
      return horaActual;
    }
    horaActual = sumarMinutos(c.hora_fin, bufferLimpieza);
  }

  // Espacio al final de la jornada
  if (diferenciaMinutos(horaActual, finJornada) >= duracionMinutos) {
    return horaActual;
  }

  throw new Error("No hay horarios disponibles para ese quirófano.");
}

// --- Utilidades internas ---
function sumarMinutos(hora, minutos) {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + minutos;
  const h2 = Math.floor(total / 60);
  const m2 = total % 60;
  return `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`;
}

function diferenciaMinutos(h1, h2) {
  const [hA, mA] = h1.split(":").map(Number);
  const [hB, mB] = h2.split(":").map(Number);
  return (hB * 60 + mB) - (hA * 60 + mA);
}
