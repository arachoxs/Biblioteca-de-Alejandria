import { Bot, X, Sparkles } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
}

export default function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="relative flex items-center justify-between px-5 py-3.5 text-white overflow-hidden">
      <div className="absolute inset-0 bg-brand-primary" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex items-center gap-2.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
            Asistente Virtual
            <Sparkles className="w-3.5 h-3.5 text-brand-accent/80" />
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <p className="text-[11px] text-white/60">En línea</p>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="relative p-2 rounded-xl text-white/60 hover:bg-white/15 hover:text-white cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Cerrar chat">
        <X className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
