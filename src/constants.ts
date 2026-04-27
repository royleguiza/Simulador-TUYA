/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Installment {
  month: string;
  amount: number;
}

export interface SummaryData {
  titular: string;
  saldoTotal: number;
  pagoMinimo: number;
  vencimiento: string;
  tem: number;
  tna: number;
  comisionMensual: number;
  iva: number;
  cuotasVencer: Installment[];
}

export const INITIAL_DATA: SummaryData = {
  titular: "LEGUIZA VICTOR ROY",
  saldoTotal: 879078.96,
  pagoMinimo: 500379.00,
  vencimiento: "2026-05-07",
  tem: 5.45,
  tna: 66.36,
  comisionMensual: 7120.00,
  iva: 21,
  cuotasVencer: [
    // La cuota de Mayo ya está incluida en el saldo total de mayo según el análisis
    { month: "Junio", amount: 254903.10 },
    { month: "Julio", amount: 115583.12 },
    { month: "Agosto", amount: 94045.69 },
    { month: "Septiembre", amount: 60973.58 },
    { month: "Octubre", amount: 31968.43 },
  ],
};
