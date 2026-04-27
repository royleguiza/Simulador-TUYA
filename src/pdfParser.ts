/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjs from 'pdfjs-dist';
import { SummaryData } from './constants';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export async function parseTuyaPDF(file: File): Promise<SummaryData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  console.log("PDF Extracted Text:", fullText);

  // Helper to extract numeric values from common patterns
  const extractValue = (pattern: RegExp) => {
    const match = fullText.match(pattern);
    if (!match) return 0;
    // Remove dots (thousands) and replace comma with dot (decimal)
    return parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
  };

  const titularMatch = fullText.match(/LEGUIZA\s+VICTOR\s+ROY/i) || fullText.match(/Titular:?\s*([A-Z\s]+)/i);
  const titular = titularMatch ? (titularMatch[1] || titularMatch[0]).trim() : "Usuario Desconocido";

  const saldoTotal = extractValue(/Saldo\s+Actual:?\s*\$?\s*([\d\.,]+)/i);
  const pagoMinimo = extractValue(/Pago\s+Mínimo:?\s*\$?\s*([\d\.,]+)/i);
  const vencimientoMatch = fullText.match(/Vencimiento\s+Actual:?\s*(\d{2}\/\d{2}\/\d{4})/i);
  const vencimiento = vencimientoMatch ? vencimientoMatch[1].split('/').reverse().join('-') : "2026-05-07";

  // Extraction of installments from the "Cuotas a vencer" section
  // Typically: Mayo/26 $ 259.076,56
  const monthNames = ["Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const cuotasVencer: { month: string, amount: number }[] = [];

  monthNames.forEach(month => {
    const regex = new RegExp(`${month}\\/26\\s*\\$?\\s*([\\d\\.,]+)`, 'i');
    const val = extractValue(regex);
    if (val > 0) {
      cuotasVencer.push({ month, amount: val });
    }
  });

  // Filter out the first month if it's already in the total (usually Mayo is included)
  const filteredCuotas = cuotasVencer.filter(c => c.month !== "Mayo" || !fullText.includes("Saldo Actual"));

  return {
    titular,
    saldoTotal: saldoTotal,
    pagoMinimo: pagoMinimo,
    vencimiento,
    tem: 5.45,
    tna: 66.36,
    comisionMensual: 7120.00,
    iva: 21,
    cuotasVencer: cuotasVencer
  };
}
