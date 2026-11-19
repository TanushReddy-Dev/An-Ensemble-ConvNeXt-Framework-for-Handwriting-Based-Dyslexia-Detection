import { QueryClient } from "@tanstack/query-core";
import { redraw, viewValue } from "./view.js";

export const cache = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
cache.getQueryCache().subscribe(({ type }) => {
  if (type === "updated" || type === "removed") redraw();
});
export const useQueryClient = () => cache;

export function useQuery({ queryKey, queryFn, enabled = true }) {
  const options = { queryKey, queryFn };
  const refetch = () =>
    cache.fetchQuery({ ...options, staleTime: 0 }).catch(() => {});
  const state = cache.getQueryState(queryKey);
  const key = JSON.stringify(queryKey);
  const visited = viewValue("queries", () => new Set());
  if (
    enabled &&
    (!state ||
      (state.isInvalidated && state.status === "success") ||
      !visited.has(key))
  ) {
    visited.add(key);
    if (state?.fetchStatus !== "fetching")
      void cache.fetchQuery(options).catch(() => {});
  }
  return {
    data: state?.data,
    error: state?.error,
    isPending: !state || state.status === "pending",
    refetch,
  };
}

export function useMutation(name, { mutationFn, onSuccess }) {
  const state = viewValue("mutation:" + name, () => ({
    status: "idle",
    error: null,
  }));
  return {
    error: state.error,
    isPending: state.status === "pending",
    isError: state.status === "error",
    isSuccess: state.status === "success",
    async mutate(values) {
      if (state.status === "pending") return;
      state.status = "pending";
      state.error = null;
      redraw();
      try {
        await mutationFn(values);
        await onSuccess?.();
        state.status = "success";
      } catch (error) {
        state.status = "error";
        state.error = error;
      } finally {
        redraw();
      }
    },
  };
}
