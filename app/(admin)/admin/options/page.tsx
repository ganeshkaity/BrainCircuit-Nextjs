"use client";

import { useEffect, useState } from "react";
import { getOnboardingOptions, updateOnboardingOptions } from "@/lib/firebase/firestore";
import type { OnboardingOptions, QuizBadge } from "@/types";
import GradientButton from "@/components/ui/GradientButton";
import { Plus, X, Save } from "lucide-react";

const GRADIENT_PRESETS = [
  { label: "Orange → Red",    value: "from-orange-500 to-red-500" },
  { label: "Blue → Cyan",     value: "from-blue-500 to-cyan-400" },
  { label: "Green → Emerald", value: "from-green-500 to-emerald-400" },
  { label: "Red → Pink",      value: "from-red-600 to-pink-500" },
  { label: "Purple → Violet", value: "from-purple-500 to-violet-400" },
  { label: "Yellow → Amber",  value: "from-yellow-500 to-amber-400" },
  { label: "Indigo → Blue",   value: "from-indigo-500 to-blue-400" },
];

export default function AdminOptionsPage() {
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Badge form state
  const [newBadgeLabel, setNewBadgeLabel] = useState("");
  const [newBadgeColor, setNewBadgeColor] = useState(GRADIENT_PRESETS[0].value);

  useEffect(() => {
    getOnboardingOptions().then(setOptions).finally(() => setLoading(false));
  }, []);

  const handleAdd = (key: keyof Omit<OnboardingOptions, "badges">) => {
    if (!options) return;
    const val = prompt(`Add new ${key.slice(0, -1)}:`);
    if (val && !options[key].includes(val)) {
      setOptions({ ...options, [key]: [...options[key], val] });
    }
  };

  const handleRemove = (key: keyof Omit<OnboardingOptions, "badges">, val: string) => {
    if (!options) return;
    setOptions({ ...options, [key]: (options[key] as string[]).filter(v => v !== val) });
  };

  const handleAddBadge = () => {
    if (!options || !newBadgeLabel.trim()) return;
    const badge: QuizBadge = { label: newBadgeLabel.trim(), color: newBadgeColor };
    setOptions({ ...options, badges: [...(options.badges || []), badge] });
    setNewBadgeLabel("");
  };

  const handleRemoveBadge = (label: string) => {
    if (!options) return;
    setOptions({ ...options, badges: options.badges.filter(b => b.label !== label) });
  };

  const handleSave = async () => {
    if (!options) return;
    setSaving(true);
    try {
      await updateOnboardingOptions(options);
      alert("Options saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save options.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 animate-pulse text-gray-500 text-center">Loading options...</div>;
  if (!options) return <div className="p-10 text-red-500">Error loading options.</div>;

  return (
    <div className="p-6 md:p-10 pb-24 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 font-display">App Options</h1>
          <p className="text-sm text-gray-400">Manage dropdown options for user onboarding and quiz badges.</p>
        </div>
        <GradientButton onClick={handleSave} isLoading={saving} className="px-6 h-11 shrink-0">
          <Save size={18} className="mr-2" /> Save Changes
        </GradientButton>
      </div>

      <div className="space-y-6">
        <OptionSection
          title="Target Exams"
          items={options.exams}
          onAdd={() => handleAdd("exams")}
          onRemove={(v) => handleRemove("exams", v)}
        />
        <OptionSection
          title="Classes"
          items={options.classes}
          onAdd={() => handleAdd("classes")}
          onRemove={(v) => handleRemove("classes", v)}
        />
        <OptionSection
          title="Languages"
          items={options.languages}
          onAdd={() => handleAdd("languages")}
          onRemove={(v) => handleRemove("languages", v)}
        />
        <OptionSection
          title="Subjects"
          items={options.subjects}
          onAdd={() => handleAdd("subjects")}
          onRemove={(v) => handleRemove("subjects", v)}
        />

        {/* ── Badge Manager ───────────────────────── */}
        <section className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <h2 className="font-bold text-white text-lg mb-5">Quiz Card Badges</h2>

          {/* Add new badge */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={newBadgeLabel}
              onChange={e => setNewBadgeLabel(e.target.value)}
              placeholder='Badge text (e.g. "Hot !", "Easy")'
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-all"
            />
            <select
              value={newBadgeColor}
              onChange={e => setNewBadgeColor(e.target.value)}
              className="bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none [color-scheme:dark]"
            >
              {GRADIENT_PRESETS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={handleAddBadge}
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-default flex items-center gap-2 text-sm font-medium shrink-0"
            >
              <Plus size={18} /> Add Badge
            </button>
          </div>

          {/* Badge list */}
          <div className="flex flex-wrap gap-3">
            {(options.badges || []).map(badge => (
              <div key={badge.label} className="flex items-center gap-2.5 group pt-2 pl-2">
                {/* Live preview ribbon */}
                <div className="relative drop-shadow-md">
                  <div 
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${badge.color}`}
                    style={{ clipPath: "polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%)", paddingRight: "1.25rem" }}
                  >
                    {badge.label}
                  </div>
                  {/* Fold preview */}
                  <div className="absolute top-full left-0 w-2 h-2 bg-black/60 [clip-path:polygon(0_0,100%_0,100%_100%)]" />
                </div>
                <button
                  onClick={() => handleRemoveBadge(badge.label)}
                  className="text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {(options.badges || []).length === 0 && (
              <p className="text-sm text-gray-500 italic">No badges defined. Add one above.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function OptionSection({ title, items, onAdd, onRemove }: { title: string, items: string[], onAdd: () => void, onRemove: (v: string) => void }) {
  return (
    <section className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-purple-600" />
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-white text-lg">{title}</h2>
        <button
          onClick={onAdd}
          className="p-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-default shadow-lg shadow-purple-900/40"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map(item => (
          <div key={item} className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-sm transition-default hover:bg-white/10 group">
            <span className="font-medium">{item}</span>
            <button
              onClick={() => onRemove(item)}
              className="text-gray-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 italic">No options defined.</p>}
      </div>
    </section>
  );
}
