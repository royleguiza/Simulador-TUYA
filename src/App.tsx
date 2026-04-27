/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line
} from 'recharts';
import { 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Info,
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_DATA, SummaryData } from './constants';
import { runSimulation } from './simulation';
import { formatCurrency, formatPercent, cn } from './lib/utils';
import { parseTuyaPDF } from './pdfParser';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [data, setData] = useState<SummaryData | null>(INITIAL_DATA);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulation = useMemo(() => data ? runSimulation(data) : [], [data]);

  const debtFreeMonth = useMemo(() => {
    if (!simulation.length) return '';
    const terminal = simulation.find(r => r.isTerminal);
    return terminal ? terminal.month : 'Más de 2 años';
  }, [simulation]);

  const totalInterests = useMemo(() => {
    return simulation.reduce((acc, curr) => acc + curr.interesesEscenarioB, 0);
  }, [simulation]);

  const totalPaidB = useMemo(() => {
    return simulation.reduce((acc, curr) => acc + curr.pagoEscenarioB, 0);
  }, [simulation]);

  const totalPaidA = useMemo(() => {
    return simulation.reduce((acc, curr) => acc + curr.pagoEscenarioA, 0);
  }, [simulation]);

  const extraCost = totalPaidB - totalPaidA;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const parsedData = await parseTuyaPDF(file);
      setData(parsedData);
    } catch (error) {
      console.error("Error parsing PDF:", error);
      alert("No se pudo procesar el PDF. Asegúrate de que sea un resumen válido de Tarjeta Tuya.");
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="bg-indigo-600 p-8 text-center text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg ring-1 ring-white/30">
              <CreditCardIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Simulador Tuya</h1>
            <p className="text-indigo-100 text-sm font-medium opacity-90 uppercase tracking-widest">Análisis Detallado de Desendeudamiento</p>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Privacidad Total</h3>
                  <p className="text-sm text-slate-500">Tus datos se procesan localmente en tu navegador. El archivo no se sube a ningún servidor externo.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Cálculo de Intereses</h3>
                  <p className="text-sm text-slate-500">Calculamos el efecto "bola de nieve" del pago mínimo con los recargos reales de la tarjeta.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group"
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                    CARGAR RESUMEN PDF
                  </>
                )
                }
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Compatible con resúmenes del Nuevo Banco del Chaco</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-inner uppercase">
              {data.titular?.[0] || 'T'}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Simulador de Desendeudamiento <span className="text-indigo-600">Tuya</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">NBCH Plan de Pagos | {data.titular}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 shadow-md"
            >
              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Cambiar Resumen
            </button>
            <div className="hidden md:flex flex-col text-right pl-6 border-l border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vencimiento base</p>
              <p className="text-sm font-semibold text-indigo-600 italic">{data.vencimiento}</p>
            </div>
          </div>
        </header>

        {/* Action Insight Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 text-indigo-100 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden ring-1 ring-white/10"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-indigo-500/20">
              💡
            </div>
            <div>
              <p className="font-bold text-white text-xl">Impacto Proyectado: Bola de Nieve</p>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                Pagando el mínimo, tardarás <span className="text-white font-black underline decoration-indigo-500 underline-offset-4">{debtFreeMonth}</span> en liquidar el saldo actual y habrás transferido <span className="text-indigo-400 font-black">{formatCurrency(extraCost)}</span> adicionales al banco por costos financieros y cargos.
              </p>
            </div>
          </div>
          <div className="text-right relative z-10 md:border-l md:border-slate-800 md:pl-8">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Ahorro Pagando Total</p>
            <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(extraCost)}</p>
          </div>
        </motion.div>

        {/* KPI Overview Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard 
            title="Saldo en Resumen" 
            value={formatCurrency(data.saldoTotal)} 
            subtitle={`Vencimiento: ${data.vencimiento}`}
            icon={<DollarSign className="w-5 h-5 text-slate-400" />}
            variant="default"
          />
          <KPICard 
            title="Cuotas a Vencer" 
            value={`${data.cuotasVencer.length} Meses`} 
            subtitle={`Total en cuotas: ${formatCurrency(data.cuotasVencer.reduce((a, b) => a + b.amount, 0))}`}
            icon={<FileText className="w-5 h-5 text-indigo-600" />}
            variant="default"
            highlightSubtitle
          />
          <KPICard 
            title="Intereses de Financiación" 
            value={formatCurrency(totalInterests)} 
            subtitle={`TEM: ${formatPercent(data.tem)}`}
            icon={<TrendingDown className="w-5 h-5 text-rose-500" rotate={180} />}
            variant="rose"
          />
          <KPICard 
            title="Mes Deuda Cero" 
            value={debtFreeMonth} 
            subtitle="Consumo proyectado: $0"
            icon={<Calendar className="w-5 h-5 text-emerald-500" />}
            variant="emerald"
          />
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Chart Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-700 flex items-center gap-2 uppercase tracking-tighter text-sm">
                 <TrendingDown className="w-4 h-4 text-slate-400" />
                 Curva de Desendeudamiento
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span> Pago
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Saldo
                </div>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulation}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v) => `$${Math.round(v/1000)}k`} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 800
                    }}
                  />
                  <Line 
                    name="Pago Sugerido" 
                    type="stepAfter" 
                    dataKey="pagoEscenarioB" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{ fill: '#4f46e5', strokeWidth: 0, r: 4 }} 
                  />
                  <Line 
                    name="Saldo Residual" 
                    type="monotone" 
                    dataKey="saldoEscenarioB" 
                    stroke="#f43f5e" 
                    strokeWidth={4} 
                    dot={{ fill: '#f43f5e', strokeWidth: 0, r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Detailed table view */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center font-black text-[10px] text-slate-500 uppercase tracking-[0.2em]">
              <span>Simulación Mensual Automática</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Cargos + IVA Incluidos</span>
            </div>
            <div className="flex-1 overflow-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4 font-black">Periodo</th>
                    <th className="px-6 py-4 font-black text-right">Saldo Inicio</th>
                    <th className="px-6 py-4 font-black text-right text-rose-500">Interés</th>
                    <th className="px-6 py-4 font-black text-right text-indigo-600">Pago Min.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/50">
                  {simulation.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-black text-slate-600 text-xs flex items-center gap-2">
                        {row.isTerminal && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {row.month}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-[11px] text-slate-500">
                        {formatCurrency(row.saldoEscenarioB)}
                      </td>
                      <td className="px-6 py-4 text-right text-rose-500 font-mono text-[11px] font-bold">
                        {row.interesesEscenarioB > 0 ? `+${formatCurrency(row.interesesEscenarioB)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-[11px] font-black text-indigo-600">
                        {formatCurrency(row.pagoEscenarioB)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Security / Formula note */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Cálculo de Precisión Bancaria</p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Esta simulación utiliza la fórmula oficial de estimación de pago mínimo: 25% del capital financiado residual (incluyendo intereses de financiación del 5.45% TEM y cargos fijos con IVA del 21%) más el 100% de las cuotas activas del mes. Todos los cálculos se realizan localmente garantizando su total privacidad.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({ title, value, icon, variant, subtitle, highlightSubtitle }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  variant: 'default' | 'rose' | 'emerald' | 'indigo', 
  subtitle: string,
  highlightSubtitle?: boolean
}) {
  const styles = {
    default: 'bg-white border-slate-200 text-slate-900',
    rose: 'bg-rose-50/50 border-rose-100 text-rose-900',
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-900',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
  };

  const labelStyles = {
    default: 'text-slate-400',
    rose: 'text-rose-500',
    emerald: 'text-emerald-500',
    indigo: 'text-indigo-500',
  };

  return (
    <div className={cn("p-6 rounded-2xl border flex flex-col gap-1 shadow-sm transition-all hover:translate-y-[-2px] active:scale-[0.98] bg-white", styles[variant])}>
      <div className="flex items-center justify-between mb-2">
        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", labelStyles[variant])}>{title}</p>
        <div className="p-2 bg-white rounded-xl shadow-sm ring-1 ring-slate-100">{icon}</div>
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className={cn(
        "text-[10px] flex items-center gap-1",
        highlightSubtitle ? "text-indigo-600 font-black italic" : "text-slate-400 font-bold"
      )}>
        {subtitle}
      </p>
    </div>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
