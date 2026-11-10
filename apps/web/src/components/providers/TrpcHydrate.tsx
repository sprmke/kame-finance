"use client";

import {
  HydrationBoundary,
  hydrate,
  useQueryClient,
  type DehydratedState,
} from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import superjson from "superjson";

interface TrpcHydrateProps {
  /** superjson-serialized output of `createServerSideHelpers().dehydrate()`. */
  state: unknown;
  children: ReactNode;
}

/**
 * Seeds the client query cache with data already fetched during the server
 * render, so the matching `useQuery` resolves on first paint instead of firing
 * a request after hydration.
 *
 * Layout-level components (quick actions, the SOA prompt) render before the
 * page and can create the same query first, still empty. HydrationBoundary
 * defers existing queries to an effect, which never runs during SSR, so the
 * server would render without data the page itself prefetched and the client
 * would hydrate with it (a mismatch). Queries that exist but have no data yet
 * are seeded synchronously here; everything else goes through the boundary.
 */
export function TrpcHydrate({ state, children }: TrpcHydrateProps) {
  const queryClient = useQueryClient();
  const dehydrated = useMemo(
    () => superjson.deserialize<DehydratedState>(state as never),
    [state],
  );

  useMemo(() => {
    const cache = queryClient.getQueryCache();
    const emptyExisting = dehydrated.queries.filter((query) => {
      const existing = cache.get(query.queryHash);
      return existing !== undefined && existing.state.data === undefined;
    });
    if (emptyExisting.length > 0) {
      hydrate(queryClient, { mutations: [], queries: emptyExisting });
    }
  }, [queryClient, dehydrated]);

  return <HydrationBoundary state={dehydrated}>{children}</HydrationBoundary>;
}
