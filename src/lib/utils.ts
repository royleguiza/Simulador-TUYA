/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value / 100);
}
