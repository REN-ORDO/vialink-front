import { AdvancedMarker } from '@vis.gl/react-google-maps';

type Props = { lat: number; lng: number; rutaNombre: string };

export default function BusActiveMarker({ lat, lng, rutaNombre }: Props) {
  return (
    <AdvancedMarker position={{ lat, lng }} zIndex={500}>
      <div className="vl-bus-active-marker">
        <span className="vl-bus-active-halo" />
        <span className="vl-bus-active-halo vl-bus-active-halo--2" />
        <span className="vl-bus-pill vl-bus-pill--active">{rutaNombre}</span>
      </div>
    </AdvancedMarker>
  );
}
