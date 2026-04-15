import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/** Public store info by slug. */
export function useStore(slug) {
  return useQuery({
    queryKey: ['store', slug],
    queryFn: () => api.get(`/shop/${slug}`).then((r) => r.data.store),
    retry: false,
  });
}

/** Current signed-in shopper for this store (null if not logged in). */
export function useShopMe(slug) {
  const { data, isLoading } = useQuery({
    queryKey: ['shop-me', slug],
    queryFn: () => api.get(`/shop/${slug}/auth/me`).then((r) => r.data.customer),
    retry: false,
  });
  return { customer: data ?? null, isLoading };
}

export function useShopActions(slug) {
  const qc = useQueryClient();
  const refreshMe = () => qc.invalidateQueries({ queryKey: ['shop-me', slug] });

  return {
    login: async (email, password) => {
      await api.post(`/shop/${slug}/auth/login`, { email, password });
      await refreshMe();
    },
    register: async (payload) => {
      await api.post(`/shop/${slug}/auth/register`, payload);
      await refreshMe();
    },
    logout: async () => {
      await api.post(`/shop/${slug}/auth/logout`);
      await refreshMe();
    },
  };
}
