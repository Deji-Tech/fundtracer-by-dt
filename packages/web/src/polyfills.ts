import { Buffer } from 'buffer';

// Polyfill Buffer
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
}

// Polyfill Global
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
    window.global = window;
}

// Polyfill process
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
    window.process = {
        env: {},
        version: '',
        nextTick: (cb: () => void) => setTimeout(cb, 0),
    } as any;
}
