"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, ClipboardList, Timer } from "lucide-react";
import Header from "@/components/layout/Header";

// Demo data for the SVG Chart
const chartData = [40, 48, 30, 45, 60, 52, 45, 55, 70, 52, 42, 60, 85, 72, 60, 45, 65, 75, 88, 72];

// Demo subject data
const subjectData = [
  { name: "Physics", score: 82, color: "bg-blue-500" },
  { name: "Chemistry", score: 74, color: "bg-purple-500" },
  { name: "Biology", score: 88, color: "bg-green-500" },
  { name: "Mathematics", score: 68, color: "bg-red-500" },
];

export default function AnalyticsPage() {
  // SVG Chart Calculation
  const width = 600;
  const height = 200;
  const maxScore = 100;
  
  // Create polygon points for the line
  const points = chartData.map((val, idx) => {
    const x = (idx / (chartData.length - 1)) * width;
    const y = height - (val / maxScore) * height;
    return `${x},${y}`;
  }).join(" ");

  // Add bottom corners for the gradient fill
  const fillPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className="min-h-screen pb-24">
      <Header title="Analytics" />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-screen-xl mx-auto px-4 md:px-8 pt-24 space-y-6"
      >
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Quizzes Taken" value="24" icon={<ClipboardList className="text-purple-400" size={20} />} />
          <StatCard title="Average Score" value="78%" icon={<Timer className="text-blue-400" size={20} />} />
          <StatCard title="Best Score" value="96%" icon={<CheckCircle className="text-green-400" size={20} />} />
          <StatCard title="Average Time Taken" value="4m 20s" icon={<Clock className="text-purple-400" size={20} />} />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Line Chart */}
          <div className="lg:col-span-2 glass-dark p-6 rounded-2xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-white">Performance Overview</h2>
              <select className="bg-gray-800 border border-white/10 text-xs text-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-purple-500">
                <option>All Quizzes</option>
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            
            <div className="flex-1 w-full h-[250px] mt-2 ml-4">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0.0)" />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map(val => {
                  const y = height - (val / 100) * height;
                  return (
                    <g key={val}>
                      <line x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <text x="-10" y={y + 4} fill="#6b7280" fontSize="10" textAnchor="end">{val}</text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {['Q1', 'Q10', 'Q20', 'Q30', 'Q40', 'Q50'].map((lbl, i) => {
                  const x = (i / 5) * width;
                  return <text key={lbl} x={x} y={height + 20} fill="#6b7280" fontSize="10" textAnchor="middle">{lbl}</text>
                })}

                {/* Area Fill */}
                <polygon points={fillPoints} fill="url(#chartGradient)" />
                
                {/* Line */}
                <polyline points={points} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round" />
                
                {/* Points */}
                {chartData.map((val, idx) => {
                  const x = (idx / (chartData.length - 1)) * width;
                  const y = height - (val / maxScore) * height;
                  return <circle key={idx} cx={x} cy={y} r="3.5" fill="#a855f7" stroke="#0f172a" strokeWidth="1.5" className="transition-all hover:r-5 cursor-pointer" />
                })}
              </svg>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="glass-dark p-6 rounded-2xl flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Subject Performance</h2>
            <div className="space-y-6 flex-1 justify-center flex flex-col">
              {subjectData.map((sub, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-200 font-medium">{sub.name}</span>
                    <span className="text-gray-400">{sub.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.score}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${sub.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass-dark p-4 md:p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden transition-all hover:border-white/20">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
          {icon}
        </div>
        <p className="text-xs md:text-sm text-gray-400 font-medium truncate">{title}</p>
      </div>
      <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{value}</p>
    </div>
  );
}
