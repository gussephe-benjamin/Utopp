import { ArrowRight } from "lucide-react";
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand";

type FeedWelcomeBannerProps = {
  userName: string;
  newOpportunitiesCount: number;
};

export function FeedWelcomeBanner({ userName, newOpportunitiesCount }: FeedWelcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#eef2ff] via-[#f4f3ff] to-[#fbf2fc] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#e3dafc]/80 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.1)] w-full">
      <div className="min-w-0 w-full sm:w-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          Hola {userName}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1 break-words">
          Tienes <span className="font-bold text-[#2f55f6]">{newOpportunitiesCount} oportunidades nuevas</span> que coinciden con tus intereses
        </p>
      </div>
      <button className={`shrink-0 w-full sm:w-auto ${TW_UTOPP_GRADIENT_R} hover:brightness-105 text-white text-sm font-semibold py-2.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(47,85,246,0.3)] hover:shadow-[0_6px_20px_rgba(47,85,246,0.4)] hover:scale-[1.02] active:scale-[0.98]`}>
        Ver todas
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
