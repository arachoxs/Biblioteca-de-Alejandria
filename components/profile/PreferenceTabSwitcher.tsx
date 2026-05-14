"use client";

type PreferenceTab = "autores" | "categorias";

interface PreferenceTabSwitcherProps {
  activeTab: PreferenceTab;
  onTabChange: (tab: PreferenceTab) => void;
}

const TABS: Array<{ key: PreferenceTab; label: string }> = [
  { key: "autores", label: "Autores" },
  { key: "categorias", label: "Categorías" },
];

export default function PreferenceTabSwitcher({
  activeTab,
  onTabChange,
}: PreferenceTabSwitcherProps) {
  return (
    <div className="flex gap-1 mb-3">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
          className={`px-4 py-1.5 text-sm rounded-full transition-all cursor-pointer ${
            activeTab === key
              ? "bg-brand-primary text-brand-bg font-medium"
              : "bg-brand-accent/10 text-brand-secondary hover:bg-brand-accent/20"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
