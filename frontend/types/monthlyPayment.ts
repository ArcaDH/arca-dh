// types/monthlyPayment.ts: matches what the backend sends for monthly payments

import type { Tag } from "./tag";

export type MonthlyPayment = {
  id: string;
  amount: number; // kronor, money out so negative
  description?: string;
  dayOfMonth: number; // 1 to 31, the 31st is the last day of a shorter month
  categoryId: string;
  subcategoryId?: string;
  tags: Tag[];
  nextCharge: string; // "YYYY-MM-DD", the next day it is due
};

/** A monthly payment with its names filled in, ready to show in the side card. */
export type MonthlyPaymentRow = {
  id: string;
  title: string; // the description, or what it is for
  ink: string; // the color of the letter in the tile, from its category
  initial: string; // the letter in the tile
  detail: string; // "Home · Rent · monthly on the 25th"
  amount: number; // money flow in kronor: negative = money out
  nextCharge: string;
  tags: Tag[];
};
