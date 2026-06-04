import { useEffect, useState } from "react";
import { getFeed } from "../../../api/feed.api";
import { getOrganizations, type OrganizationSummary } from "../../../api/users.api";
import type { FeedPostOut, FeedResponse } from "../../../types/post.types";

const ORG_PAGE_SIZE = 100;

function pickLatestEvents(items: FeedPostOut[]): FeedPostOut[] {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 2);
}

async function fetchAllOrganizations(): Promise<OrganizationSummary[]> {
  const all: OrganizationSummary[] = [];
  let page = 1;

  while (true) {
    const batch = await getOrganizations({ page, size: ORG_PAGE_SIZE });
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < ORG_PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

/**
 * Datos públicos (sin JWT) para el panel de marca de las pantallas auth:
 * últimos eventos creados por organizaciones y organizaciones disponibles.
 *
 * Ambos endpoints son pre-login (GET /feed con auth opcional, GET /users/organizations
 * sin auth), por lo que funcionan en /login y /register sin sesión.
 *
 * Falla en silencio: si el fetch falla, devuelve arrays vacíos y el panel
 * cae con elegancia a su contenido estático (headline + benefits).
 */
export function useAuthShowcase() {
  const [events, setEvents] = useState<FeedPostOut[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [feed, orgs] = await Promise.all([
          getFeed({ type: "event", sort: "recent", page: 1, size: 6 }) as Promise<FeedResponse>,
          fetchAllOrganizations(),
        ]);

        if (!mounted) return;
        setEvents(pickLatestEvents(feed.items ?? []));
        setOrganizations(orgs);
      } catch (err) {
        console.error("Error cargando showcase de auth:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return {
    events,
    organizations,
    loading,
    hasEvents: events.length > 0,
    hasOrganizations: organizations.length > 0,
  };
}
