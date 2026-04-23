"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle, FilePlus, Settings } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { createQuizSet } from "@/lib/firebase/firestore";
import type { Question } from "@/types";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Convert letter answer(s) "A", "B,C", "a" → 0-based indices */
function letterToIndex(raw: string): number[] {
  return raw
    .toUpperCase()
    .split(",")
    .map(s => s.trim())
    .map(s => "ABCD".indexOf(s))
    .filter(n => n !== -1);
}

// ─── shared components ────────────────────────────────────────────────────────

const InputField = ({ label, name, value, onChange, type = "text", ...rest }: any) => (
  <div>
    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-all"
      {...rest}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: any; options: { value: string; label: string }[] }) => (
  <div>
    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-all [color-scheme:dark]"
    >
      {options.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
    </select>
  </div>
);

// ─── component ───────────────────────────────────────────────────────────────

export default function CreateQuizPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    exam: "NEET",
    subject: "Physics",
    language: "English",
    classLevel: "12",
    durationMinutes: 60,
    marksPerQuestion: 4,
    negativeMarks: 1,
    questionCount: 50,
  });

  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const downloadTemplate = () => {
    const rows = [
      {
        question_text: "What is acceleration if velocity changes by 2 m/s in 1 second?",
        option_a: "2 m/s²",
        option_b: "3 m/s²",
        option_c: "4 m/s²",
        option_d: "5 m/s²",
        correct_answers: "A",
        question_type: "mcq_single",
        image_url: "",
        solution_text: "Acceleration = Δv/t = 2/1 = 2 m/s²",
        solution_image_url: "",
        chapter: "Kinematics",
        topic: "Motion",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "brain_circuit_template.xlsx");
  };

  const processUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (rawJson.length === 0) {
        alert("Excel file is empty.");
        setLoading(false);
        return;
      }

      const cols = Object.keys(rawJson[0]);
      console.log("📊 Detected columns:", cols);
      setDetectedColumns(cols);

      const parsed: Question[] = rawJson.map((rawRow, i) => {
          // Normalize keys to lowercase snake_case for robust parsing
          const row: Record<string, any> = {};
          for (const k in rawRow) {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
            row[cleanKey] = rawRow[k];
          }

          const rawType = String(row["question_type"] ?? row["type"] ?? "mcq_single").toLowerCase();
          let type: "single" | "multi" | "integer" = "single";
          if (rawType.includes("multi")) type = "multi";
          if (rawType.includes("int") || rawType.includes("num")) type = "integer";

          let correctOptions: number[] = [];
          if (type === "integer") {
            const numVal = parseFloat(String(row["correct_answers"] ?? row["correct_answer"] ?? row["answer"] ?? "0"));
            correctOptions = [isNaN(numVal) ? 0 : numVal];
          } else {
            const correctRaw = String(row["correct_answers"] ?? row["correct_answer"] ?? row["answer"] ?? "A");
            correctOptions = letterToIndex(correctRaw);
          }

        return {
          id: `q_${Date.now()}_${i}`,
          text: String(row["question_text"] ?? row["question"] ?? row["text"] ?? `Question ${i + 1}`),
          options: [
            String(row["option_a"] ?? row["option1"] ?? ""),
            String(row["option_b"] ?? row["option2"] ?? ""),
            String(row["option_c"] ?? row["option3"] ?? ""),
            String(row["option_d"] ?? row["option4"] ?? ""),
          ],
          correctOptions: correctOptions.length ? correctOptions : [0],
          subject: form.subject, // ← taken from the page form, not Excel
          chapter: String(row["chapter"] ?? row["topic"] ?? "General"),
          difficulty: "medium",
          type,
          exam: form.exam as Question["exam"],
          language: form.language as Question["language"],
          explanation: String(row["solution_text"] ?? row["explanation"] ?? ""),
          ...(String(row["image_url"] ?? "").trim() ? { imageUrl: String(row["image_url"]) } : {}),
        };
      });

      setQuestions(parsed);
      setForm(f => ({ ...f, questionCount: Math.min(50, parsed.length) }));
      setStep(2);
    } catch (e: any) {
      console.error(e);
      alert(`Error parsing Excel: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async () => {
    if (!form.title) return alert("Please enter a title.");
    if (Number(form.questionCount) > questions.length)
      return alert(`Question count cannot exceed ${questions.length} (total uploaded).`);

    setLoading(true);
    try {
      await createQuizSet({
        title: form.title,
        description: form.description,
        exam: form.exam as any,
        classLevel: form.classLevel as any,
        language: form.language as any,
        subjects: [form.subject],
        questions,
        questionCount: Number(form.questionCount),
        totalMarks: Number(form.questionCount) * Number(form.marksPerQuestion),
        negativeMarks: Number(form.negativeMarks),
        durationMinutes: Number(form.durationMinutes),
        marksPerQuestion: Number(form.marksPerQuestion),
      });
      alert("✅ Quiz created successfully!");
      setStep(1);
      setFile(null);
      setQuestions([]);
      setForm(f => ({ ...f, title: "", description: "" }));
    } catch (e) {
      console.error(e);
      alert("Failed to create quiz. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Upload ──────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="p-6 md:p-10 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <FilePlus className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Quiz Wizard</h1>
        </div>

        <div className="glass rounded-3xl p-8 text-center border-2 border-dashed border-white/20">
          <UploadCloud size={48} className="mx-auto text-purple-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Step 1 — Upload Question Bank</h3>
          <p className="text-sm text-gray-400 mb-2 max-w-md mx-auto">
            Upload an <strong>.xlsx</strong> file. Columns expected:
          </p>
          <code className="text-xs text-purple-300 bg-purple-900/20 px-3 py-2 rounded-lg block max-w-lg mx-auto mb-4 text-left leading-relaxed">
            question_text, option_a, option_b, option_c, option_d,<br />
            correct_answers (A/B/C/D), question_type, chapter, topic,<br />
            image_url (optional), solution_text (optional)
          </code>

          <button
            onClick={downloadTemplate}
            className="mb-6 text-xs text-purple-300 hover:text-purple-200 underline underline-offset-2 transition-colors"
          >
            ⬇ Download Example Template
          </button>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="block w-full max-w-sm mx-auto text-sm text-gray-400
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-600/20 file:text-purple-300
              hover:file:bg-purple-600/30"
          />

          {file && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-sm text-green-400 flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-lg">
                <CheckCircle size={16} /> {file.name}
              </p>
              <GradientButton onClick={processUpload} isLoading={loading}>
                Parse & Continue →
              </GradientButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Step 2: Configure ───────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-10 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Step 2 — Configure Quiz</h1>
        <button onClick={() => { setStep(1); setFile(null); setQuestions([]); }} className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← Re-upload
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Left: Config ─── */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-4">
          <div className="glass p-6 rounded-2xl space-y-4">
            <InputField label="Quiz Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Physics Grand Test 1" />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short description…"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Exam" name="exam" value={form.exam} onChange={handleChange} options={[
                { value: "NEET", label: "NEET" },
                { value: "JEE Mains", label: "JEE Mains" },
                { value: "JEE Advanced", label: "JEE Advanced" },
              ]} />
              <SelectField label="Class" name="classLevel" value={form.classLevel} onChange={handleChange} options={[
                { value: "11", label: "Class 11" },
                { value: "12", label: "Class 12" },
                { value: "Dropper", label: "Dropper" },
              ]} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Subject" name="subject" value={form.subject} onChange={handleChange} options={[
                { value: "Physics", label: "Physics" },
                { value: "Chemistry", label: "Chemistry" },
                { value: "Biology", label: "Biology" },
                { value: "Maths", label: "Maths" },
              ]} />
              <SelectField label="Language" name="language" value={form.language} onChange={handleChange} options={[
                { value: "English", label: "English" },
                { value: "Hindi", label: "Hindi" },
              ]} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <InputField label="Duration (m)" name="durationMinutes" value={form.durationMinutes} onChange={handleChange} type="number" />
              <InputField label="+Marks/Q" name="marksPerQuestion" value={form.marksPerQuestion} onChange={handleChange} type="number" />
              <InputField label="-Negative" name="negativeMarks" value={form.negativeMarks} onChange={handleChange} type="number" />
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1">
                Questions to Ask Per Attempt
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Excel has <span className="text-white font-bold">{questions.length}</span> questions. Enter how many to randomly pick each time.
              </p>
              <input
                type="number"
                name="questionCount"
                value={form.questionCount}
                onChange={handleChange}
                min={1}
                max={questions.length}
                className="w-full bg-gray-950 border border-purple-500/50 rounded-xl px-4 py-3 text-xl font-black text-white focus:ring-2 focus:ring-purple-500 outline-none text-center"
              />
            </div>

            <GradientButton fullWidth size="lg" onClick={handleCreate} isLoading={loading}>
              Save Quiz
            </GradientButton>
          </div>
        </div>

        {/* ─── Right: Preview ─── */}
        <div className="flex-1 min-w-0">
          <div className="glass p-5 rounded-2xl flex flex-col h-full">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Preview ({questions.length} Questions)</h3>
                {detectedColumns.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">Columns: {detectedColumns.join(", ")}</p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[65vh] pr-1 scrollbar-none">
              {questions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex gap-2 mb-2">
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">Q{i + 1}</span>
                    <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">{q.chapter}</span>
                    <span className="text-xs bg-green-500/20 px-2 py-0.5 rounded text-green-300">
                      Ans: {q.correctOptions.map(n => "ABCD"[n]).join(",")}
                    </span>
                  </div>
                  <p className="text-sm text-white line-clamp-2 mb-2">{q.text}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className={`text-xs px-2 py-1.5 rounded truncate ${q.correctOptions.includes(idx) ? "bg-green-500/20 text-green-300" : "bg-black/20 text-gray-400"}`}>
                        {["A", "B", "C", "D"][idx]}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
