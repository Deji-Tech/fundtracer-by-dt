export interface AddressLabel {
    address: string;
    label: string;
    timestamp: number;
}

const STORAGE_KEY = 'fundtracer_address_book';

export const getAddressBook = (): Record<string, string> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

export const getLabel = (address: string): string | undefined => {
    const book = getAddressBook();
    return book[address.toLowerCase()];
};

export const setLabel = (address: string, label: string) => {
    const book = getAddressBook();
    if (!label.trim()) {
        delete book[address.toLowerCase()];
    } else {
        book[address.toLowerCase()] = label.trim();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
    // Dispatch event for reactivity
    window.dispatchEvent(new Event('addressBookChanged'));
    return book;
};

export const removeLabel = (address: string) => {
    const book = getAddressBook();
    delete book[address.toLowerCase()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
    window.dispatchEvent(new Event('addressBookChanged'));
    return book;
};
