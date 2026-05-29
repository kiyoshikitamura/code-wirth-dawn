export default function TitleLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-gray-800/30 border-t-gray-400 rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-gray-500/60 text-sm tracking-widest font-serif animate-pulse">
        読み込み中...
      </p>
    </div>
  );
}
