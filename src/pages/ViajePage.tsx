import { useParams } from 'react-router-dom';

export default function ViajePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex-1 p-4">
      <h1 className="text-2xl font-semibold">Viaje activo</h1>
      <p className="text-sm text-text-secondary mt-1">ID: {id}</p>
    </div>
  );
}
