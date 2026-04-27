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
  Loader2
} from 'lucide-react';
import { INITIAL_DATA } from './constants';
import { runSimulation } from './simulation';
import { formatCurrency, formatPercent, cn } from './lib/utils';
import { parseTuyaPDF } from './pdfParser';

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulation = useMemo(() => runSimulation(data), [data]);

  const debtFreeMonth = useMemo(() => {
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl shadow-sm overflow-hidden">
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Subir Resumen PDF
            </button>
            <div className="hidden md:flex flex-col text-right pl-6 border-l border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vencimiento base</p>
              <p className="text-sm font-semibold text-indigo-600 italic">{data.vencimiento}</p>
            </div>
          </div>
        </header>

        {/* Action Insight Banner */}
        <div className="bg-indigo-900 text-indigo-100 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg ring-4 ring-indigo-400/20">
              💡
            </div>
            <div>
              <p className="font-bold text-white text-lg">Análisis de impacto: Bola de Nieve</p>
              <p className="text-sm text-slate-300 max-w-xl">
                Al pagar solo el mínimo, tardarás hasta <span className="text-white font-bold">{debtFreeMonth}</span> en salir de la deuda y pagarás un extra de <span className="text-indigo-400 font-bold">{formatCurrency(extraCost)}</span> solo en intereses y cargos.
              </p>
            </div>
          </div>
          <div className="text-right relative z-10 md:border-l md:border-slate-800 md:pl-8">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Ahorro Pagando Total</p>
            <p className="text-3xl font-bold text-white tracking-tighter">{formatCurrency(extraCost)}</p>
          </div>
        </div>

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
            title="Intereses Proyectados" 
            value={formatCurrency(totalInterests)} 
            subtitle="Costo financiero (Esc. B)"
            icon={<TrendingDown className="w-5 h-5 text-rose-500" rotate={180} />}
            variant="rose"
          />
          <KPICard 
            title="Mes Deuda Cero" 
            value={debtFreeMonth} 
            subtitle="Sin nuevos consumos"
            icon={<Calendar className="w-5 h-5 text-emerald-500" />}
            variant="emerald"
          />
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Chart Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <TrendingDown className="w-4 h-4 text-slate-400" />
                 Evolución de Pago vs Deuda
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm"></span> Pago Sugerido
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm"></span> Saldo Pendiente
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulation}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
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
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  />
                  <Line 
                    name="Pago Sugerido" 
                    type="stepAfter" 
                    dataKey="pagoEscenarioB" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 3, stroke: '#fff' }} 
                  />
                  <Line 
                    name="Saldo Pendiente" 
                    type="monotone" 
                    dataKey="saldoEscenarioB" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{ fill: '#f43f5e', strokeWidth: 2, r: 3, stroke: '#fff' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Detailed table view */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center font-bold text-xs text-slate-500 uppercase tracking-widest">
              <span>Proyección Mensual (Mensual)</span>
              <span className="text-indigo-600">Calculado al 100% precision</span>
            </div>
            <div className="flex-1 overflow-auto max-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-slate-400 text-[9px] uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-3 font-bold">Mes</th>
                    <th className="px-6 py-3 font-bold text-right">Saldo Inicial</th>
                    <th className="px-6 py-3 font-bold text-right text-rose-500">Interés</th>
                    <th className="px-6 py-3 font-bold text-right text-indigo-600">Pago Min.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {simulation.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3 font-bold text-slate-600 text-xs flex items-center gap-2">
                        {row.isTerminal && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        {row.month}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-[11px] text-slate-500">
                        {formatCurrency(row.saldoEscenarioB)}
                      </td>
                      <td className="px-6 py-3 text-right text-rose-400 font-mono text-[11px]">
                        {row.interesesEscenarioB > 0 ? `+${formatCurrency(row.interesesEscenarioB)}` : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-[11px] font-black text-indigo-600">
                        {formatCurrency(row.pagoEscenarioB)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Note on simulation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-xs text-slate-400 flex items-start gap-4">
          <Info className="w-5 h-5 shrink-0 text-slate-300 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-slate-500">Nota técnica sobre los cálculos:</p>
            <p>La simulación asume **consumo cero** a partir del resumen cargado. El pago mínimo se estima siguiendo la fórmula reglamentaria: 25% del saldo de consumo nuevo/financiado (incluyendo intereses de financiación del 5.45% TEM y cargos fijos con IVA) más el 100% de las cuotas sin interés del mes. El "Mes Deuda Cero" se alcanza cuando el saldo residual es inferior a $1.</p>
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
    default: 'bg-white border-slate-200 text-slate-900 shadow-sm',
    rose: 'bg-rose-50 border-rose-100 text-rose-900 shadow-sm',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900 shadow-sm',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm',
  };

  const labelStyles = {
    default: 'text-slate-500',
    rose: 'text-rose-600',
    emerald: 'text-emerald-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className={cn("p-5 rounded-xl border flex flex-col gap-1 transition-all hover:scale-[1.01] bg-white", styles[variant])}>
      <div className="flex items-center justify-between mb-2">
        <p className={cn("text-[10px] font-black uppercase tracking-widest", labelStyles[variant])}>{title}</p>
        <div className="p-1.5 bg-white/50 rounded-lg backdrop-blur-sm shadow-sm">{icon}</div>
      </div>
      <p className="text-xl font-black tracking-tight">{value}</p>
      <p className={cn(
        "text-[10px] flex items-center gap-1",
        highlightSubtitle ? "text-indigo-600 font-bold italic" : "text-slate-400 font-medium"
      )}>
        {subtitle}
      </p>
    </div>
  );
}
