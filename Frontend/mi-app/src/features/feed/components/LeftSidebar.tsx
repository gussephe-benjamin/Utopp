import { Bookmark, Calendar, Trophy, BarChart2, MessageSquare, UserCircle } from "lucide-react";
import { SyntheticBadge } from "../../../components/ui/SyntheticBadge";
import { useNavigate } from "react-router-dom";

type LeftSidebarProps = {
  userName?: string;
  avatarUrl?: string | null;
  career?: string | null;
  cycle?: number | null;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
};

export function LeftSidebar({
  userName,
  avatarUrl,
  career,
  cycle,
  postsCount,
  followersCount,
  followingCount,
}: LeftSidebarProps) {
  const navigate = useNavigate();

  const displayName = userName ?? "Usuario";
  const academicLine = [career, cycle ? `Ciclo ${cycle}` : null].filter(Boolean).join(" · ");

  return (
    <aside className="hidden lg:flex w-72 flex-col gap-4 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pb-6 no-scrollbar">
      
      {/* Widget Perfil */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="h-24 bg-gradient-to-br from-blue-600 via-indigo-500 to-fuchsia-500 w-full relative">
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-sm">
             {avatarUrl ? (
               <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-400 to-indigo-500">
                 <UserCircle className="w-10 h-10 text-white/80" />
               </div>
             )}
           </div>
        </div>
        <div className="pt-10 pb-5 px-4 text-center flex flex-col items-center">
          <h3 className="font-bold text-gray-900 text-lg">{displayName}</h3>
          {academicLine ? (
            <p className="text-xs text-gray-500 mt-0.5">{academicLine}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5 italic">Sin carrera registrada</p>
          )}
          
          <div className="w-full flex justify-between mt-5 mb-4 px-3">
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-900 text-base">{followersCount ?? 0}</span>
              <span className="text-[10px] text-gray-400 font-medium">Seguidores</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-900 text-base">{followingCount ?? 0}</span>
              <span className="text-[10px] text-gray-400 font-medium">Seguidos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-900 text-base">{postsCount ?? 0}</span>
              <span className="text-[10px] text-gray-400 font-medium">Public.</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/app/perfil")}
            className="w-full py-2.5 px-3 rounded-full border border-violet-200 text-violet-600 text-xs font-semibold hover:bg-violet-50 transition-colors"
          >
            Ver perfil completo
          </button>
        </div>
      </div>

      {/* Widget Mis intereses */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h4 className="font-bold text-gray-800 text-sm mb-3">Mis intereses</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">#Tech</span>
          <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-semibold">#Emprendimiento</span>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">#Música</span>
          <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-semibold">#Intercambios</span>
        </div>
        <button className="text-violet-600 text-xs font-semibold hover:underline">
          Editar intereses
        </button>
      </div>

      {/* Widget Accesos rápidos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800 text-sm">Accesos rápidos</h4>
          <SyntheticBadge />
        </div>
        <nav className="flex flex-col gap-1.5">
          <button className="flex items-center gap-3 text-sm text-gray-600 font-medium py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Bookmark className="w-4 h-4 text-gray-400" />
            Guardadas
          </button>
          <button className="flex items-center gap-3 text-sm text-gray-600 font-medium py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 text-gray-400" />
            Mi calendario
          </button>
          <button className="flex items-center gap-3 text-sm text-gray-600 font-medium py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Trophy className="w-4 h-4 text-gray-400" />
            Mis logros
          </button>
          <button className="flex items-center gap-3 text-sm text-gray-600 font-medium py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            Mis métricas
          </button>
          <button className="flex items-center gap-3 text-sm text-gray-600 font-medium py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            Mensajes
          </button>
        </nav>
      </div>

    </aside>
  );
}
