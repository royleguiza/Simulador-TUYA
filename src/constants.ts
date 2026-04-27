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

export const INITIAL_DATA: SummaryData | null = null;
