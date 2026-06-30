import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';
import CustomSelect from './CustomSelect';

export default function ZonaFilter({ value, onChange }) {
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const data = await fetchWithAuth('/zonas');
        setZonas(data);
      } catch (error) {
        console.error('Error al cargar zonas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchZonas();
  }, []);

  const options = [
    { value: '', label: 'Todas las zonas' },
    ...zonas.map(zona => ({
      value: zona.id,
      label: `${zona.nombre} (${zona.ciudad}) - Nivel: ${zona.nivel_afectacion}`
    }))
  ];

  return (
    <div style={{ flex: '1 1 200px', minWidth: '250px' }}>
        <CustomSelect 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={options}
          placeholder="Filtrar por Zona"
          isDisabled={loading}
        />
      </div>
  );
}
