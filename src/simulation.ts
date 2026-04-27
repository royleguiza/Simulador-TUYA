/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { SummaryData } from './constants';

export interface SimulationResult {
  month: string;
  saldoEscenarioA: number;
  saldoEscenarioB: number;
  pagoEscenarioA: number;
  pagoEscenarioB: number;
  interesesEscenarioB: number;
  isTerminal: boolean;
}

/**
 * Arredonda para 2 casas decimais para precisão financeira.
 */
function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function runSimulation(data: SummaryData): SimulationResult[] {
  const results: SimulationResult[] = [];
  const fixedFee = round(data.comisionMensual * (1 + data.iva / 100)); // Cargos + IVA
  const tem = data.tem / 100;
  const startDate = parseISO(data.vencimiento);

  // Escenario A: Pago Total
  let currentSaldoA = round(data.saldoTotal);
  
  // Escenario B: Pago Mínimo
  let currentSaldoB = round(data.saldoTotal);

  // Simulamos até 24 meses ou até que a dívida seja zero
  for (let m = 0; m < 24; m++) {
    const currentDate = addMonths(startDate, m);
    const monthName = format(currentDate, 'MMM yy', { locale: es });
    
    // Cuota a vencer para este mes
    const installmentIdx = m - 1; // 0 é Mayo, 1 é Junio...
    const monthlyInstallment = (installmentIdx >= 0 && installmentIdx < data.cuotasVencer.length) 
      ? data.cuotasVencer[installmentIdx].amount 
      : 0;

    // --- ESCENARIO A (PAGO TOTAL) ---
    let paymentA = 0;
    if (m === 0) {
      paymentA = round(currentSaldoA);
      currentSaldoA = 0;
    } else {
      const debtCurrentMonthA = round(monthlyInstallment + (monthlyInstallment > 0 ? fixedFee : 0));
      paymentA = debtCurrentMonthA;
      currentSaldoA = 0;
    }

    // --- ESCENARIO B (PAGO MÍNIMO) ---
    let paymentB = 0;
    let interestThisMonth = 0;
    let saldoInicioMesB = round(currentSaldoB);

    if (m === 0) {
      paymentB = round(data.pagoMinimo);
      currentSaldoB = round(saldoInicioMesB - paymentB);
    } else {
      // 1. Intereses sobre o saldo financiado
      interestThisMonth = round(currentSaldoB * tem);
      
      // 2. Novo Saldo (Saldo Anterior + Interesses + Cuota + Cargos Fixos)
      const newCharges = round(monthlyInstallment + (currentSaldoB > 0 || monthlyInstallment > 0 ? fixedFee : 0));
      currentSaldoB = round(currentSaldoB + interestThisMonth + newCharges);

      // 3. Pago Mínimo: 25% do saldo financiado (incluindo juros e taxas) + 100% da parcela
      const balanceToApplyPct = round(currentSaldoB - monthlyInstallment);
      paymentB = round(balanceToApplyPct * 0.25 + monthlyInstallment);
      
      if (paymentB > currentSaldoB) {
        paymentB = currentSaldoB;
      }
      
      currentSaldoB = round(currentSaldoB - paymentB);
    }

    results.push({
      month: monthName,
      saldoEscenarioA: paymentA,
      saldoEscenarioB: round(saldoInicioMesB),
      pagoEscenarioA: paymentA,
      pagoEscenarioB: paymentB,
      interesesEscenarioB: interestThisMonth,
      isTerminal: currentSaldoB <= 0.01 && m > 0
    });

    if (currentSaldoB <= 0.01 && m > 0) break;
  }

  return results;
}

