export default function BattleLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-red-900/30 border-t-red-500 rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-red-200/60 text-sm tracking-widest font-serif animate-pulse">
        戦闘準備中...
      </p>
    </div>
  );
}
