import { useQuery } from '@tanstack/react-query';
import { patentsService } from '@/api/patents';
import type { 
  PatentsSearchParams
} from '@/api/patents';

// Query keys
export const patentsKeys = {
  sorts: (params?: PatentsSearchParams) => ['patents-sorts', params] as const,
  sort: (id: number) => ['patents-sort', id] as const,
  cultures: (params?: { group?: number; search?: string }) => ['patents-cultures', params] as const,
  culture: (id: number) => ['patents-culture', id] as const,
  cultureGroups: ['patents-culture-groups'] as const,
  cultureGroup: (id: number) => ['patents-culture-group', id] as const,
  originators: (params?: { search?: string; country?: string }) => ['patents-originators', params] as const,
  originator: (id: number) => ['patents-originator', id] as const,
  sortsByCulture: (cultureId: number, params?: { search?: string }) => 
    ['patents-sorts-by-culture', cultureId, params] as const,
  sortsByCultureGroup: (groupId: number, params?: { search?: string }) => 
    ['patents-sorts-by-culture-group', groupId, params] as const,
};

// Search sorts with advanced filtering
export const usePatentsSorts = (params?: PatentsSearchParams) => {
  return useQuery({
    queryKey: patentsKeys.sorts(params),
    queryFn: () => patentsService.searchSorts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  });
};

// Get sort by ID
export const usePatentsSort = (id: number | undefined) => {
  return useQuery({
    queryKey: patentsKeys.sort(id!),
    queryFn: () => patentsService.getSortById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get all cultures
export const usePatentsCultures = (params?: { group?: number; search?: string }) => {
  return useQuery({
    queryKey: patentsKeys.cultures(params),
    queryFn: () => patentsService.getCultures(params),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Get culture by ID
export const usePatentsCulture = (id: number | undefined) => {
  return useQuery({
    queryKey: patentsKeys.culture(id!),
    queryFn: () => patentsService.getCultureById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Get all culture groups
export const usePatentsCultureGroups = () => {
  return useQuery({
    queryKey: patentsKeys.cultureGroups,
    queryFn: () => patentsService.getCultureGroups(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Get culture group by ID
export const usePatentsCultureGroup = (id: number | undefined) => {
  return useQuery({
    queryKey: patentsKeys.cultureGroup(id!),
    queryFn: () => patentsService.getCultureGroupById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Get all originators
export const usePatentsOriginators = (params?: { search?: string; country?: string }) => {
  return useQuery({
    queryKey: patentsKeys.originators(params),
    queryFn: () => patentsService.getOriginators(params),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Get originator by ID
export const usePatentsOriginator = (id: number | undefined) => {
  return useQuery({
    queryKey: patentsKeys.originator(id!),
    queryFn: () => patentsService.getOriginatorById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Get sorts by culture
export const usePatentsSortsByCulture = (
  cultureId: number | undefined, 
  params?: { search?: string }
) => {
  return useQuery({
    queryKey: patentsKeys.sortsByCulture(cultureId!, params),
    queryFn: () => patentsService.getSortsByCulture(cultureId!, params),
    enabled: !!cultureId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get sorts by culture group
export const usePatentsSortsByCultureGroup = (
  groupId: number | undefined, 
  params?: { search?: string }
) => {
  return useQuery({
    queryKey: patentsKeys.sortsByCultureGroup(groupId!, params),
    queryFn: () => patentsService.getSortsByCultureGroup(groupId!, params),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Combined hook for all patents data (convenience)
export const usePatents = () => {
  const { data: cultureGroups = [] } = usePatentsCultureGroups();
  const { data: cultures = [] } = usePatentsCultures();
  const { data: originators = [] } = usePatentsOriginators();

  return {
    cultureGroups,
    cultures,
    originators,
  };
};
