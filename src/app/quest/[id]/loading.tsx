export default function QuestLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-violet-900/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-violet-200/60 text-sm tracking-widest font-serif animate-pulse">
        冒険の書を開いています...
      </p>
    </div>
  );
}
