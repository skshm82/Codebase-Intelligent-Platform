export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-6 py-5 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-sm">
          CI
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Codebase Intelligence
          </h1>
          <p className="text-xs text-gray-400">
            Ask questions about any public GitHub repository
          </p>
        </div>
      </div>
    </header>
  );
}
