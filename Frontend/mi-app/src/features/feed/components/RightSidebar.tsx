import { Calendar as CalendarIcon, Flame, Trophy } from "lucide-react";
import { SyntheticBadge } from "../../../components/ui/SyntheticBadge";

export function RightSidebar() {
  return (
    <aside className="hidden xl:flex w-80 flex-col gap-4 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pb-6 no-scrollbar">
      
      {/* Widget Trending en UTEC */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 fill-current" />
            <h4 className="font-bold text-gray-800 text-sm">Trending en UTEC</h4>
          </div>
          <SyntheticBadge />
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

      {/* Widget Orgs de la semana */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h4 className="font-bold text-gray-800 text-sm">Orgs de la semana</h4>
          </div>
          <SyntheticBadge />
        </div>
        
        <div className="flex flex-col gap-3.5">
          {[
            { name: "IEEE UTEC", initial: "I", bg: "bg-blue-100 text-blue-700", posts: "12 publicaciones" },
            { name: "UTEC Career Center", initial: "U", bg: "bg-indigo-100 text-indigo-700", posts: "8 publicaciones" },
            { name: "UTEC Emprende", initial: "U", bg: "bg-purple-100 text-purple-700", posts: "6 publicaciones" },
            { name: "TECHO Perú", initial: "T", bg: "bg-violet-100 text-violet-700", posts: "4 publicaciones" },
          ].map((org) => (
            <div key={org.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${org.bg}`}>
                  {org.initial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-900 truncate hover:text-[#2563EB] cursor-pointer">
                      {org.name}
                    </span>
                    <svg className="w-3 h-3 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                      <title>Verificado</title>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{org.posts}</p>
                </div>
              </div>
              
              <button className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] hover:brightness-105 text-white text-[10px] font-bold shadow-sm transition-all active:scale-95 shrink-0">
                Seguir
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Widget Esta semana */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-violet-600" />
            <h4 className="font-bold text-gray-800 text-sm">Esta semana</h4>
          </div>
          <SyntheticBadge />
        </div>
        
        <div className="flex flex-col gap-3">
          {/* Item 1 */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
              <span className="text-[10px] font-bold uppercase leading-none mt-0.5">MAR</span>
              <span className="text-sm font-bold leading-tight">5</span>
            </div>
            <div className="pt-0.5">
              <p className="text-xs font-bold text-gray-800 leading-snug">Demo Day Startup Founders</p>
            </div>
          </div>
          
          {/* Item 2 */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
              <span className="text-[10px] font-bold uppercase leading-none mt-0.5">JUE</span>
              <span className="text-sm font-bold leading-tight">7</span>
            </div>
            <div className="pt-0.5">
              <p className="text-xs font-bold text-gray-800 leading-snug">Workshop AI con UTEC Lab</p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
              <span className="text-[10px] font-bold uppercase leading-none mt-0.5">VIE</span>
              <span className="text-sm font-bold leading-tight">8</span>
            </div>
            <div className="pt-0.5">
              <p className="text-xs font-bold text-gray-800 leading-snug">Networking Emprendedor</p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-fuchsia-500 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
              <span className="text-[10px] font-bold uppercase leading-none mt-0.5">SAB</span>
              <span className="text-sm font-bold leading-tight">9</span>
            </div>
            <div className="pt-0.5">
              <p className="text-xs font-bold text-gray-800 leading-snug">Festival Cultural</p>
            </div>
          </div>
        </div>

        <button className="mt-4 text-violet-600 text-xs font-semibold hover:underline w-full text-left">
          Ver calendario completo →
        </button>
      </div>

    </aside>
  );
}
