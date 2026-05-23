import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';
import type { LatLng } from '../types';

export function useAssistantHistory() {
  return useQuery({
    queryKey: ['assistant-history'],
    queryFn: () => dataSource.listAssistantMessages(20),
    staleTime: 30_000,
  });
}

export function useAskAssistant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { question: string; location?: LatLng }) =>
      dataSource.askAssistant(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assistant-history'] });
    },
  });
}
