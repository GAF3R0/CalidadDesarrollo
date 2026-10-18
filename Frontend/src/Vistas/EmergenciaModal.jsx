import React, { useState } from 'react';
import '../styles/EmergenciaModal.css';

const EmergenciaModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  pacientes = [], 
  quirofanos = [], 
  equipos = [] 
}) => {
  const [formData, setFormData] = useState({
    id_expediente: '',
    id_quirófano: '',
    id_equipomedico: '',
    procedimiento: 'Cirugía de Emergencia',
    urgencia: 'alta',
    observaciones: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id_expediente || !formData.id_quirófano) {
      alert('Por favor selecciona el paciente y el quirófano para la emergencia.');
      return;
    }
    onConfirm(formData);
    onClose();
    setFormData({
      id_expediente: '',
      id_quirófano: '',
      id_equipomedico: '',
      procedimiento: 'Cirugía de Emergencia',
      urgencia: 'alta',
      observaciones: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="emergencia-modal">
        <div className="modal-header">
          <h2>🚨 Cirugía de Emergencia</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="emergencia-form">
          <div className="form-group">
            <label>Paciente *</label>
            <select
              name="id_expediente"
              value={formData.id_expediente}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar Paciente --</option>
              {pacientes.map(p => (
                <option key={p.id_expediente || p.id_paciente} value={p.id_expediente}>
                  {p.nombre} {p.apellido} (Exp: {p.numero_expediente || 'S/N'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quirófano *</label>
            <select
              name="id_quirófano"
              value={formData.id_quirófano}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar Quirófano --</option>
              {quirofanos.map(q => (
                <option key={q.sala || q.id_quirófano} value={q.id_quirófano || q.sala}>
                  {q.sala} ({q.estado})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Equipo Médico / Especialista</label>
            <select
              name="id_equipomedico"
              value={formData.id_equipomedico}
              onChange={handleChange}
            >
              <option value="">-- Seleccionar Equipo o Especialista --</option>
              {equipos.map(eq => (
                <option key={eq.id_equipomedico || eq.id} value={eq.id_equipomedico || eq.id}>
                  {eq.nombre} {eq.medico_nombre ? `- Dr. ${eq.medico_nombre} ${eq.medico_apellido || ''}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Procedimiento / Motivo *</label>
            <input
              type="text"
              name="procedimiento"
              value={formData.procedimiento}
              onChange={handleChange}
              placeholder="Ej. Laparotomía exploratoria urgente"
              required
            />
          </div>

          <div className="form-group">
            <label>Nivel de Urgencia *</label>
            <div className="urgencia-options">
              <label className="urgencia-option">
                <input
                  type="radio"
                  name="urgencia"
                  value="alta"
                  checked={formData.urgencia === 'alta'}
                  onChange={handleChange}
                />
                <span className="urgencia-alta">Alta (Inmediata)</span>
              </label>
              <label className="urgencia-option">
                <input
                  type="radio"
                  name="urgencia"
                  value="media"
                  checked={formData.urgencia === 'media'}
                  onChange={handleChange}
                />
                <span className="urgencia-media">Media (1-2h)</span>
              </label>
              <label className="urgencia-option">
                <input
                  type="radio"
                  name="urgencia"
                  value="baja"
                  checked={formData.urgencia === 'baja'}
                  onChange={handleChange}
                />
                <span className="urgencia-baja">Baja (Mismo día)</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Observaciones / Diagnóstico</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Notas médicas de la urgencia..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-confirmar">
              🚨 Programar Emergencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergenciaModal;