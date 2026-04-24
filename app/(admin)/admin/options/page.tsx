"use client";

import { useEffect, useState } from "react";
import { getOnboardingOptions, updateOnboardingOptions } from "@/lib/firebase/firestore";
import type { OnboardingOptions } from "@/types";
import GradientButton from "@/components/ui/GradientButton";
import { Plus, X, Save } from "lucide-react";

export default function AdminOptionsPage() {
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOnboardingOptions().then(setOptions).finally(() => setLoading(false));
  }, []);

  const handleAdd = (key: keyof OnboardingOptions) => {
    if (!options) return;
    const val = prompt(`Add new ${key.slice(0, -1)}:`);
    if (val && !options[key].includes(val)) {
      setOptions({ ...options, [key]: [...options[key], val] });
    }
  };

  const handleRemove = (key: keyof OnboardingOptions, val: string) => {
    if (!options) return;
    setOptions({ ...options, [key]: options[key].filter(v => v !== val) });
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
          <p className="text-sm text-gray-400">Manage dropdown options for user onboarding.</p>
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
