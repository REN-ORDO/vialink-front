import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Bus } from '../../types';

type Props = { bus: Bus };

export default function BusMarker({ bus }: Props) {
  return (
    <AdvancedMarker position={{ lat: bus.lat, lng: bus.lng }}>
      <div className="vl-bus-marker">
        <span className="vl-bus-pill">{bus.rutaNombre}</span>
      </div>
    </AdvancedMarker>
  );
}
