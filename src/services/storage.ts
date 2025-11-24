import { Transaction, CategoryItem, Ledger } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const STORAGE_KEY = 'geminiflow_transactions';
const BUDGET_KEY = 'geminiflow_budget';
const CATEGORIES_KEY = 'geminiflow_categories';
const LEDGERS_KEY = 'geminiflow_ledgers';

export const DEFAULT_LEDGERS: Ledger[] = [
    { id: 'default_1', name: '日常账本', icon: '📒', isDefault: true },
];

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transactions', error);
  }
};

export const loadTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load transactions', error);
    return [];
  }
};

export const saveBudget = (budget: number): void => {
    try {
        localStorage.setItem(BUDGET_KEY, budget.toString());
    } catch (error) {
        console.error('Failed to save budget', error);
    }
};

export const loadBudget = (): number => {
    try {
        const data = localStorage.getItem(BUDGET_KEY);
        return data ? parseFloat(data) : 0;
    } catch (error) {
        return 0;
    }
};

export const saveCategories = (categories: { expense: CategoryItem[]; income: CategoryItem[] }): void => {
    try {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
        console.error('Failed to save categories', error);
    }
};

export const loadCategories = (): { expense: CategoryItem[]; income: CategoryItem[] } => {
    try {
        const data = localStorage.getItem(CATEGORIES_KEY);
        return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (error) {
        return DEFAULT_CATEGORIES;
    }
};

export const saveLedgers = (ledgers: Ledger[]): void => {
    try {
        localStorage.setItem(LEDGERS_KEY, JSON.stringify(ledgers));
    } catch (error) {
        console.error('Failed to save ledgers', error);
    }
};

export const loadLedgers = (): Ledger[] => {
    try {
        const data = localStorage.getItem(LEDGERS_KEY);
        return data ? JSON.parse(data) : DEFAULT_LEDGERS;
    } catch (error) {
        return DEFAULT_LEDGERS;
    }
};

// --- Sync Helpers ---

export interface AppData {
    transactions: Transaction[];
    budget: number;
    categories: { expense: CategoryItem[]; income: CategoryItem[] };
    ledgers: Ledger[];
    lastSyncedAt?: number;
}

export const getAllData = (): AppData => {
    return {
        transactions: loadTransactions(),
        budget: loadBudget(),
        categories: loadCategories(),
        ledgers: loadLedgers(),
        lastSyncedAt: Date.now()
    };
};

export const restoreData = (data: AppData) => {
    if (data.transactions) saveTransactions(data.transactions);
    if (typeof data.budget === 'number') saveBudget(data.budget);
    if (data.categories) saveCategories(data.categories);
    if (data.ledgers) saveLedgers(data.ledgers);
};