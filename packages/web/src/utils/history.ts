export interface HistoryItem {
    address: string;
    label?: string;
    timestamp: number;
    chain?: string;
}

const HISTORY_KEY = 'fundtracer_search_history';
const MAX_HISTORY = 10;

export const getHistory = (): HistoryItem[] => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const addToHistory = (address: string, chain: string, label?: string) => {
    const history = getHistory();
    // Remove if exists (to move to top)
    const filtered = history.filter(item => item.address.toLowerCase() !== address.toLowerCase());

    const newItem: HistoryItem = {
        address,
        label,
        timestamp: Date.now(),
        chain
    };

    const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};

export const removeFromHistory = (address: string) => {
    const history = getHistory();
    const newHistory = history.filter(item => item.address.toLowerCase() !== address.toLowerCase());
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
};
