import { Calendar, Target, Briefcase } from "lucide-react";
import { resolveAvatarUrl } from "../../../shared/lib/cloudinaryUrl";

type FeedQuickCreateProps = {
  avatarUrl?: string | null;
  onOpenWizard: () => void;
};

export function FeedQuickCreate({ avatarUrl, onOpenWizard }: FeedQuickCreateProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0 overflow-hidden border border-gray-50 shadow-sm">
          {avatarUrl ? (
            <img src={resolveAvatarUrl(avatarUrl) ?? avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <img src="https://i.pravatar.cc/150?img=11" alt="Mock Avatar" className="w-full h-full object-cover" />
          )}
        </div>
        <button
          onClick={onOpenWizard}
          className="flex-1 bg-white hover:bg-gray-50/50 border border-violet-100 rounded-full py-2.5 px-5 text-left text-sm text-gray-500 transition-colors shadow-sm focus:outline-none"
        >
          ¿Quieres compartir una oportunidad?
        </button>
      </div>
      
      {/* Opciones alineadas a la izquierda (bajo el avatar) y sin línea divisoria */}
      <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
        <button 
          onClick={onOpenWizard} 
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-violet-600 hover:opacity-85 transition-opacity py-1.5 focus:outline-none"
        >
          <Calendar className="w-4 h-4 stroke-[2.5]" />
          Evento
        </button>
        <button 
          onClick={onOpenWizard} 
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-fuchsia-500 hover:opacity-85 transition-opacity py-1.5 focus:outline-none"
        >
          <Target className="w-4 h-4 stroke-[2.5]" />
          Convocatoria
        </button>
        <button 
          onClick={onOpenWizard} 
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-500 hover:opacity-85 transition-opacity py-1.5 focus:outline-none"
        >
          <Briefcase className="w-4 h-4 stroke-[2.5]" />
          Pasantía
        </button>
      </div>
    </div>
  );
}
