import { useQuery } from '@tanstack/react-query';
import { methodologyService } from '@/api/methodology';
import { SummaryFilters } from '@/types/summary.types';

export const useSummary = (filters: SummaryFilters) => {
  return useQuery({
    queryKey: ['summary', filters],
    queryFn: () => methodologyService.getSummary(filters),
    enabled: !!(filters.year && filters.oblast_id),
  });
};
