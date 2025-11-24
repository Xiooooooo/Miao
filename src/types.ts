export type TransactionType = 'income' | 'expense';

export interface Ledger {
  id: string;
  name: string;
  icon: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  subCategory?: string; 
  date: string; // ISO Date String YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  note: string;
  ledgerId: string; // Changed from scope to ledgerId
  createdAt: number;
}

export interface TransactionFormData {
  amount: string;
  type: TransactionType;
  category: string;
  subCategory?: string;
  date: string;
  note: string;
  ledgerId: string;
}

export interface AIParseResult {
  amount: number;
  type: TransactionType;
  category: string;
  subCategory?: string;
  date: string;
  note: string;
  // scope removed, AI doesn't decide ledger anymore, the UI context does
  confidence: number;
}

export interface CategoryItem {
  icon: string;
  name: string;
  type: TransactionType;
  children?: CategoryItem[];
}