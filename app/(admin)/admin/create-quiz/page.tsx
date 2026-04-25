"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle, FilePlus, Settings } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { createQuizSet, getOnboardingOptions } from "@/lib/firebase/firestore";
import { useUIStore } from "@/store/uiStore";
import type { Question } from "@/types";
import { useQuery } from "@tanstack/react-query";

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

const MultiSelectField = ({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        onClick={() => {
          if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
          else onChange([...selected, opt]);
        }}
        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
          selected.includes(opt) ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

// ─── component ───────────────────────────────────────────────────────────────

export default function CreateQuizPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  
  const [isMultiExam, setIsMultiExam] = useState(false);
  const [isMultiSubject, setIsMultiSubject] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const { showAlert } = useUIStore();

  const { data: options } = useQuery({
    queryKey: ["onboarding-options"],
    queryFn: getOnboardingOptions,
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    exam: "",
    subject: "",
    language: "",
    classLevel: "",
    durationMinutes: 60,
    marksPerQuestion: 4,
    negativeMarks: 1,
    questionCount: 50,
    badgeLabel: "", // Optional badge
  });

  // Initialize form defaults when options load
  useEffect(() => {
    if (options && !form.exam) {
      setForm(f => ({
        ...f,
        exam: options.exams[0] || "",
        subject: options.subjects[0] || "",
        language: options.languages[0] || "",
        classLevel: options.classes[0] || "",
      }));
      if (selectedExams.length === 0) setSelectedExams([options.exams[0] || ""]);
      if (selectedSubjects.length === 0) setSelectedSubjects([options.subjects[0] || ""]);
    }
  }, [options, form.exam]);

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
        showAlert({ 
          message: "The uploaded Excel file appears to be empty. Please check the file and try again.", 
          type: "warning", 
          title: "Empty File" 
        });
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
          exam: isMultiExam ? selectedExams : (form.exam as Question["exam"]),
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
      showAlert({ 
        message: `There was an error parsing the Excel file: ${e.message}. Please ensure you're using the correct template.`, 
        type: "error", 
        title: "Parsing Error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async () => {
    if (!form.title) {
      showAlert({ message: "Please enter a title for the quiz.", type: "warning", title: "Missing Title" });
      return;
    }
    if (Number(form.questionCount) > questions.length) {
      showAlert({ 
        message: `The selected question count (${form.questionCount}) cannot exceed the total number of uploaded questions (${questions.length}).`, 
        type: "warning", 
        title: "Invalid Count" 
      });
      return;
    }

    const finalExams = isMultiExam ? selectedExams : [form.exam];
    const finalSubjects = isMultiSubject ? selectedSubjects : [form.subject];

    if (isMultiExam && finalExams.length === 0) {
      showAlert({ message: "Please select at least one exam.", type: "warning", title: "Missing Exam" });
      return;
    }
    if (isMultiSubject && finalSubjects.length === 0) {
      showAlert({ message: "Please select at least one subject.", type: "warning", title: "Missing Subject" });
      return;
    }

    setLoading(true);
    try {
      await createQuizSet({
        title: form.title,
        description: form.description,
        exam: isMultiExam ? finalExams : (form.exam as any),
        classLevel: form.classLevel as any,
        language: form.language as any,
        subjects: finalSubjects,
        questions,
        questionCount: Number(form.questionCount),
        totalMarks: Number(form.questionCount) * Number(form.marksPerQuestion),
        negativeMarks: Number(form.negativeMarks),
        durationMinutes: Number(form.durationMinutes),
        marksPerQuestion: Number(form.marksPerQuestion),
        ...(form.badgeLabel && options?.badges?.find(b => b.label === form.badgeLabel)
          ? { badge: options.badges.find(b => b.label === form.badgeLabel) }
          : {}),
      });
      showAlert({ 
        message: "Your quiz has been created and is now available for students.", 
        type: "success", 
        title: "Quiz Created" 
      });
      setStep(1);
      setFile(null);
      setQuestions([]);
      setForm(f => ({ ...f, title: "", description: "" }));
    } catch (e) {
      console.error(e);
      showAlert({ 
        message: "Failed to create the quiz. Please check the console for technical details.", 
        type: "error", 
        title: "Creation Failed" 
      });
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
  if (!options) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

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

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400">Exam Mode</span>
              <label className="flex items-center gap-2 cursor-pointer">
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Multi-Exam</span>
                 <div className="relative">
                    <input type="checkbox" className="sr-only" checked={isMultiExam} onChange={e => setIsMultiExam(e.target.checked)} />
                    <div className={`w-8 h-4 rounded-full transition-colors ${isMultiExam ? "bg-purple-500" : "bg-white/10"}`} />
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${isMultiExam ? "translate-x-4.5" : "translate-x-0.5"}`} style={{ left: '2px' }} />
                 </div>
              </label>
            </div>
            
            {isMultiExam ? (
              <div className="space-y-3">
                <MultiSelectField options={options.exams} selected={selectedExams} onChange={setSelectedExams} />
                <SelectField label="Class Level" name="classLevel" value={form.classLevel} onChange={handleChange} options={options.classes.map(c => ({ value: c, label: `Class ${c}` }))} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Exam" name="exam" value={form.exam} onChange={handleChange} options={options.exams.map(e => ({ value: e, label: e }))} />
                <SelectField label="Class" name="classLevel" value={form.classLevel} onChange={handleChange} options={options.classes.map(c => ({ value: c, label: `Class ${c}` }))} />
              </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400">Subject Mode</span>
              <label className="flex items-center gap-2 cursor-pointer">
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Multi-Subject</span>
                 <div className="relative">
                    <input type="checkbox" className="sr-only" checked={isMultiSubject} onChange={e => setIsMultiSubject(e.target.checked)} />
                    <div className={`w-8 h-4 rounded-full transition-colors ${isMultiSubject ? "bg-purple-500" : "bg-white/10"}`} />
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${isMultiSubject ? "translate-x-4.5" : "translate-x-0.5"}`} style={{ left: '2px' }} />
                 </div>
              </label>
            </div>

            {isMultiSubject ? (
              <div className="space-y-3">
                <MultiSelectField options={options.subjects} selected={selectedSubjects} onChange={setSelectedSubjects} />
                <SelectField label="Language" name="language" value={form.language} onChange={handleChange} options={options.languages.map(l => ({ value: l, label: l }))} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Subject" name="subject" value={form.subject} onChange={handleChange} options={options.subjects.map(s => ({ value: s, label: s }))} />
                <SelectField label="Language" name="language" value={form.language} onChange={handleChange} options={options.languages.map(l => ({ value: l, label: l }))} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <SelectField 
                label="Corner Badge (Optional)" 
                name="badgeLabel" 
                value={form.badgeLabel} 
                onChange={handleChange} 
                options={[{ value: "", label: "None" }, ...(options.badges || []).map(b => ({ value: b.label, label: b.label }))]} 
              />
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
