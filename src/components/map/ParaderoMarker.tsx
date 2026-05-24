import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { useNavigate } from 'react-router-dom';
import type { Paradero } from '../../types';

type Props = { paradero: Paradero };

export default function ParaderoMarker({ paradero }: Props) {
  const navigate = useNavigate();
  return (
    <AdvancedMarker
      position={{ lat: paradero.lat, lng: paradero.lng }}
      onClick={() => navigate(`/paradero/${paradero.id}`)}
    >
      <div className="vl-paradero-marker">
        <span className="vl-paradero-dot" />
      </div>
    </AdvancedMarker>
  );
}
