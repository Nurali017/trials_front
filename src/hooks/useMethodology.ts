import { useQuery } from '@tanstack/react-query';
import { methodologyService } from '@/api/methodology';
import { MethodologyTableFilters } from '@/types/methodology.types';

export const useMethodologyTable = (filters: MethodologyTableFilters) => {
  return useQuery({
    queryKey: ['methodology-table', filters],
    queryFn: () => methodologyService.getMethodologyTable(filters),
    enabled: !!(filters.year && filters.oblast_id && filters.culture_id),
  });
};
