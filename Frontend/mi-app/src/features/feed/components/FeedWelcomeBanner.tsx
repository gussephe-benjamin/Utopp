type FeedWelcomeBannerProps = {
  userName: string;
};

export function FeedWelcomeBanner({ userName }: FeedWelcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#eef2ff] via-[#f4f3ff] to-[#fbf2fc] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#e3dafc]/80 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.1)] w-full">
      <div className="min-w-0 w-full sm:w-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          Hola {userName}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1 break-words">
          Bienvenido a Utopp
        </p>
      </div>
    </div>
  );
}
