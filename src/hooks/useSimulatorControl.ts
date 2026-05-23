import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataSource } from '../lib/dataSource';

export function useSimulatorStatus() {
  return useQuery({
    queryKey: ['simulator-status'],
    queryFn: () => dataSource.getSimulatorStatus(),
    refetchInterval: 5_000,
  });
}

export function useStartSimulator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentCount: number) => dataSource.startSimulator(agentCount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['simulator-status'] }),
  });
}

export function useStopSimulator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dataSource.stopSimulator(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['simulator-status'] }),
  });
}

export function useResetSimulator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dataSource.resetSimulator(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['simulator-status'] }),
  });
}
