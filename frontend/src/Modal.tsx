
export function GenericModal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3 className="text-xl font-headline-md text-white mb-4">{title}</h3>
        <div className="text-text-secondary">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-primary hover:brightness-110 text-white shadow-sm">Confirm</button>
        </div>
      </div>
    </div>
  );
}
