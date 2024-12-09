import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

// Initialize theme from localStorage or default to dark
const userTheme = getThemeOrCreateItInLocalStorage();
// Create theme store
export const theme = writable<Theme>(userTheme);

function getThemeOrCreateItInLocalStorage() {
	if (browser) {
		const storedTheme: any = localStorage.getItem('theme');
		if (storedTheme === null) {
			localStorage.setItem('theme', 'light');
			return 'light';
		}
		return storedTheme;
	}
}

// Update theme and persist to localStorage
export function toggleTheme() {
	// if theme doesn't exist in localstorage, set it to the default theme which is light

	theme.update((current) => {
		const newTheme = current === 'light' ? 'dark' : 'light';
		if (browser) {
			localStorage.setItem('theme', newTheme);
			document.documentElement.classList.toggle('dark', newTheme === 'dark');
		}
		return newTheme;
	});
}
