import React, { useState } from 'react';
import '../styles/EmergenciaModal.css';

const EmergenciaModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    paciente: '',
    tipoCirugia: '',
    urgencia: 'alta',
    especialista: '',
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
    onConfirm(formData);
    onClose();
    setFormData({
      paciente: '',
      tipoCirugia: '',
      urgencia: 'alta',
      especialista: '',
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
            <input
              type="text"
              name="paciente"
              value={formData.paciente}
              onChange={handleChange}
              placeholder="Nombre del paciente"
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Cirugía *</label>
            <select
              name="tipoCirugia"
              value={formData.tipoCirugia}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar tipo</option>
              <option value="cardiaca">Cardíaca</option>
              <option value="trauma">Trauma</option>
              <option value="neuro">Neurocirugía</option>
              <option value="abdominal">Abdominal</option>
              <option value="toracica">Torácica</option>
              <option value="vascular">Vascular</option>
              <option value="otra">Otra</option>
            </select>
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
                <span className="urgencia-alta">Alta</span>
              </label>
              <label className="urgencia-option">
                <input
                  type="radio"
                  name="urgencia"
                  value="media"
                  checked={formData.urgencia === 'media'}
                  onChange={handleChange}
                />
                <span className="urgencia-media">Media</span>
              </label>
              <label className="urgencia-option">
                <input
                  type="radio"
                  name="urgencia"
                  value="baja"
                  checked={formData.urgencia === 'baja'}
                  onChange={handleChange}
                />
                <span className="urgencia-baja">Baja</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Especialista Asignado *</label>
            <input
              type="text"
              name="especialista"
              value={formData.especialista}
              onChange={handleChange}
              placeholder="Nombre del especialista"
              required
            />
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Observaciones adicionales..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-confirmar">
              🚨 Confirmar Cirugía
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergenciaModal;