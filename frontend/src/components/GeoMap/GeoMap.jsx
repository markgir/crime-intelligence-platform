import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';

// Fix default marker icons for webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLORS = {
  open: '#ef4444',
  investigating: '#f59e0b',
  closed: '#22c55e',
};

const crimeIcon = (status) => L.divIcon({
  html: `<div style="background:${STATUS_COLORS[status] || '#8899bb'};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
  iconSize: [12, 12],
  className: '',
});

const cameraIcon = L.divIcon({
  html: `<div style="background:#00d4ff;width:14px;height:14px;border-radius:3px;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:8px">📷</div>`,
  iconSize: [14, 14],
  className: '',
});

const FitBounds = ({ crimes, cameras }) => {
  const map = useMap();
  useEffect(() => {
    const allPoints = [
      ...crimes.filter(c => c.latitude && c.longitude).map(c => [parseFloat(c.latitude), parseFloat(c.longitude)]),
      ...cameras.filter(c => c.latitude && c.longitude).map(c => [parseFloat(c.latitude), parseFloat(c.longitude)]),
    ];
    if (allPoints.length > 0) {
      try { map.fitBounds(allPoints, { padding: [40, 40] }); } catch (_) {}
    }
  }, [crimes, cameras, map]);
  return null;
};

const GeoMap = () => {
  const [crimes, setCrimes] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCameras, setShowCameras] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const defaultCenter = [38.716, -9.139]; // Lisbon

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [crimesRes, camerasRes, heatmapRes] = await Promise.all([
          api.get('/analytics/crimes-map'),
          api.get('/cameras/map/all'),
          api.get('/analytics/geoheatmap'),
        ]);
        setCrimes(crimesRes.data.crimes || []);
        setCameras(camerasRes.data.cameras || []);
        setHeatmap(heatmapRes.data.points || []);
      } catch (err) {
        setError('Erro ao carregar dados do mapa.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredCrimes = filterStatus
    ? crimes.filter(c => c.status === filterStatus)
    : crimes;

  const statusLabel = { open: 'Abertos', investigating: 'Investigação', closed: 'Encerrados', '': 'Todos' };

  if (loading) return <div style={{ padding: '2rem', color: '#8899bb' }}>A carregar mapa...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🗺️ Geolocalização Avançada</h1>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.8rem 1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ color: '#8899bb', fontSize: '0.85rem' }}>Estado:</span>
            {['', 'open', 'investigating', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="btn"
                style={{
                  background: filterStatus === s ? (STATUS_COLORS[s] || '#00d4ff') : '#1e2d4a',
                  color: filterStatus === s ? 'white' : '#8899bb',
                  padding: '0.3rem 0.8rem', fontSize: '0.8rem',
                }}
              >
                {statusLabel[s]}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#8899bb', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showCameras} onChange={e => setShowCameras(e.target.checked)} />
              📷 Câmeras CCTV
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#8899bb', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} />
              🌡️ Zonas de Risco
            </label>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span>🔴 Aberto: <strong style={{ color: '#ef4444' }}>{crimes.filter(c => c.status === 'open').length}</strong></span>
            <span>🟡 Investigação: <strong style={{ color: '#f59e0b' }}>{crimes.filter(c => c.status === 'investigating').length}</strong></span>
            <span>🟢 Encerrado: <strong style={{ color: '#22c55e' }}>{crimes.filter(c => c.status === 'closed').length}</strong></span>
            <span>📷 Câmeras: <strong style={{ color: '#00d4ff' }}>{cameras.length}</strong></span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      {crimes.length === 0 && cameras.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#8899bb' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🗺️</div>
          <div>Sem dados georreferenciados disponíveis.</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Adicione coordenadas GPS aos crimes para visualizar no mapa.</div>
        </div>
      ) : (
        <div style={{ borderRadius: '8px', overflow: 'hidden', height: '600px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds crimes={filteredCrimes} cameras={showCameras ? cameras : []} />

            {/* Crime markers */}
            {filteredCrimes.map(crime => (
              <Marker
                key={`crime-${crime.id}`}
                position={[parseFloat(crime.latitude), parseFloat(crime.longitude)]}
                icon={crimeIcon(crime.status)}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      🚨 {crime.crime_type_name || 'Crime'}
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '2px' }}>📍 {crime.location}</div>
                    <div style={{ fontSize: '12px', marginBottom: '2px' }}>
                      📅 {new Date(crime.crime_date).toLocaleDateString('pt-PT')}
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Estado: <strong>{crime.status}</strong>
                    </div>
                    {crime.description && (
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', maxWidth: '200px' }}>
                        {crime.description.slice(0, 100)}{crime.description.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Camera markers */}
            {showCameras && cameras.map(cam => (
              <Marker
                key={`cam-${cam.id}`}
                position={[parseFloat(cam.latitude), parseFloat(cam.longitude)]}
                icon={cameraIcon}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📷 {cam.name}</div>
                    <div style={{ fontSize: '12px', marginBottom: '2px' }}>📍 {cam.location}</div>
                    <div style={{ fontSize: '12px' }}>
                      Estado: <strong style={{ color: cam.status === 'active' ? 'green' : 'red' }}>{cam.status}</strong>
                    </div>
                    {cam.stream_url && (
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        <a href={cam.stream_url} target="_blank" rel="noopener noreferrer">🎥 Ver stream</a>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Heatmap circles */}
            {showHeatmap && heatmap.map((pt, i) => (
              <Circle
                key={i}
                center={[pt.lat, pt.lon]}
                radius={Math.min(500, 100 * pt.intensity)}
                pathOptions={{
                  fillColor: '#ef4444',
                  fillOpacity: Math.min(0.6, 0.15 * pt.intensity),
                  stroke: false,
                }}
              />
            ))}
          </MapContainer>
        </div>
      )}

      {/* Legend */}
      <div className="card" style={{ marginTop: '1rem', padding: '0.8rem 1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <span style={{ color: '#8899bb' }}>Legenda:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
            <span style={{ color: '#8899bb' }}>Crime Aberto</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
            <span style={{ color: '#8899bb' }}>Em Investigação</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
            <span style={{ color: '#8899bb' }}>Crime Encerrado</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#00d4ff' }}>📷</span>
            <span style={{ color: '#8899bb' }}>Câmera CCTV</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(239,68,68,0.4)' }}></span>
            <span style={{ color: '#8899bb' }}>Zona de Risco</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GeoMap;
