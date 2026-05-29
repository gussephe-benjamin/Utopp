import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Flame, Trophy } from "lucide-react";
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand";
import { getOrganizations, getMyFollowingOrganizations, followUser, unfollowUser } from "../../../api/users.api";
import { getMyRoles } from "../../../api/roles.api";
import { getFeed } from "../../../api/feed.api";
import type { OrganizationSummary } from "../../../api/users.api";

type RightSidebarProps = {
  showTrending?: boolean;
};

const getInitialStyle = (id: number) => {
  const styles = [
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-purple-100 text-purple-700",
    "bg-violet-100 text-violet-700",
    "bg-pink-100 text-pink-700",
    "bg-fuchsia-100 text-fuchsia-700",
  ];
  return styles[id % styles.length];
};

const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const daysOfWeek = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
  return {
    dayName: daysOfWeek[date.getDay()],
    dayNumber: date.getDate(),
  };
};

export function RightSidebar({ showTrending = true }: RightSidebarProps) {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    const loadData = async () => {
      try {
        // 1. Fetch all organizations
        const orgs = await getOrganizations();

        if (token) {
          // 2. Fetch followed organizations
          const followed = await getMyFollowingOrganizations().catch(() => []);
          setFollowedIds(new Set(followed.map((o) => o.id)));

          // 3. Fetch user roles to see if they are a student
          const roles = await getMyRoles().catch(() => []);
          const hasStudentRole = roles.some((r) => r.name.toLowerCase() === "estudiante");
          setIsStudent(hasStudentRole);
        }

        // Sort by interaction_score desc, then followers_count desc, then posts_count desc
        const sortedOrgs = [...orgs].sort((a, b) => {
          if ((b.interaction_score ?? 0) !== (a.interaction_score ?? 0)) {
            return (b.interaction_score ?? 0) - (a.interaction_score ?? 0);
          }
          if (b.followers_count !== a.followers_count) {
            return b.followers_count - a.followers_count;
          }
          return (b.posts_count ?? 0) - (a.posts_count ?? 0);
        });

        setOrganizations(sortedOrgs.slice(0, 4));

        // 4. Fetch upcoming events
        const eventsData = await getFeed({ type: "event", page: 1, size: 10 });
        const now = new Date();
        const upcomingEvents = eventsData.items.filter((item: any) => {
          if (!item.deadline_at) return false;
          return new Date(item.deadline_at) >= now;
        });

        const sortedEvents = upcomingEvents.sort((a: any, b: any) => {
          return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
        });

        if (sortedEvents.length === 0) {
          const allEvents = eventsData.items.filter((item: any) => !!item.deadline_at);
          setEvents(allEvents.slice(0, 4));
        } else {
          setEvents(sortedEvents.slice(0, 4));
        }
      } catch (error) {
        console.error("Error loading sidebar data:", error);
      } finally {
        setLoading(false);
        setEventsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFollowToggle = async (orgId: number) => {
    if (!isStudent) return;
    setActionLoadingId(orgId);
    const isCurrentlyFollowing = followedIds.has(orgId);

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(orgId);
        setFollowedIds((prev) => {
          const next = new Set(prev);
          next.delete(orgId);
          return next;
        });
        setOrganizations((prev) =>
          prev.map((org) =>
            org.id === orgId
              ? { ...org, followers_count: Math.max(0, org.followers_count - 1) }
              : org
          )
        );
      } else {
        await followUser(orgId);
        setFollowedIds((prev) => {
          const next = new Set(prev);
          next.add(orgId);
          return next;
        });
        setOrganizations((prev) =>
          prev.map((org) =>
            org.id === orgId ? { ...org, followers_count: org.followers_count + 1 } : org
          )
        );
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <aside className="hidden xl:flex w-80 flex-col gap-4 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pb-6 no-scrollbar">
      
      {/* Widget Trending en UTEC */}
      {showTrending ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500 fill-current" />
              <h4 className="font-bold text-gray-800 text-sm">Trending en UTEC</h4>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {[
              { tag: "#Hackathon", count: "324 posts" },
              { tag: "#Voluntariado", count: "198 posts" },
              { tag: "#Intercambio", count: "156 posts" },
              { tag: "#DemoDay", count: "112 posts" },
              { tag: "#IA", count: "98 posts" },
            ].map((item) => (
              <div key={item.tag} className="flex justify-between items-center text-xs font-semibold">
                <span className="text-[#2563EB] hover:underline cursor-pointer">{item.tag}</span>
                <span className="text-gray-400 font-normal">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Widget Orgs de la semana */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h4 className="font-bold text-gray-800 text-sm">Orgs de la semana</h4>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-2 animate-pulse">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3 bg-gray-100 rounded w-24 mb-1.5" />
                    <div className="h-2 bg-gray-100 rounded w-16" />
                  </div>
                </div>
                <div className="w-14 h-6 bg-gray-100 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">No hay organizaciones disponibles</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {organizations.map((org) => {
              const isFollowing = followedIds.has(org.id);
              const initial = (org.full_name ?? "O").charAt(0).toUpperCase();
              const styleClass = getInitialStyle(org.id);
              const postText = org.posts_count === 1 ? "1 publicación" : `${org.posts_count ?? 0} publicaciones`;

              return (
                <div key={org.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      onClick={() => navigate(`/app/perfil/${org.id}`)}
                      className="cursor-pointer shrink-0 hover:scale-105 transition-all duration-300"
                    >
                      {org.profile_image_url ? (
                        <img
                          src={org.profile_image_url}
                          alt={org.full_name}
                          className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${styleClass}`}>
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          onClick={() => navigate(`/app/perfil/${org.id}`)}
                          className="text-xs font-bold text-gray-900 truncate hover:text-[#2563EB] cursor-pointer"
                        >
                          {org.full_name}
                        </span>
                        <svg className="w-3 h-3 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                          <title>Verificado</title>
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{postText}</p>
                    </div>
                  </div>
                  
                  {isStudent && (
                    <button
                      onClick={() => handleFollowToggle(org.id)}
                      disabled={actionLoadingId === org.id}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all active:scale-95 shrink-0 ${
                        isFollowing
                          ? "border border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                          : `${TW_UTOPP_GRADIENT_R} hover:brightness-105 text-white`
                      }`}
                    >
                      {actionLoadingId === org.id ? (
                        <span className="inline-block animate-pulse">...</span>
                      ) : isFollowing ? (
                        "Siguiendo"
                      ) : (
                        "Seguir"
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Widget Esta semana */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-violet-600" />
            <h4 className="font-bold text-gray-800 text-sm">Esta semana</h4>
          </div>
        </div>
        
        {eventsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                <div className="pt-1.5 flex-1">
                  <div className="h-3 bg-gray-100 rounded w-32 mb-1.5" />
                  <div className="h-2 bg-gray-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No hay eventos para mostrar</p>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const { dayName, dayNumber } = formatEventDate(event.deadline_at);
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold uppercase leading-none mt-0.5">{dayName}</span>
                    <span className="text-sm font-bold leading-tight">{dayNumber}</span>
                  </div>
                  <div className="pt-0.5 min-w-0 flex-1">
                    <p
                      onClick={() => navigate(`/app/perfil/${event.user_id}?postId=${event.id}`)}
                      className="text-xs font-bold text-gray-800 leading-snug hover:text-[#2563EB] cursor-pointer truncate"
                      title={event.title}
                    >
                      {event.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      Organizado por: {event.user_name || "Organización"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </aside>
  );
}
