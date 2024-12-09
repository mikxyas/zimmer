import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function getThemeOrCreateItInLocalStorage() {
	if (browser) {
		const storedTheme: any = localStorage.getItem('theme');
		if (storedTheme === null) {
			localStorage.setItem('theme', 'light');
			document.documentElement.classList.remove('dark');
			return 'light';
		}
		// Apply theme class on initialization
		document.documentElement.classList.toggle('dark', storedTheme === 'dark');
		return storedTheme;
	}
	return 'light';
}

// Initialize theme from localStorage or default to dark
const userTheme = getThemeOrCreateItInLocalStorage();
// Create theme store
export const theme = writable<Theme>(userTheme);

// Update theme and persist to localStorage
export function toggleTheme() {
	theme.update((current) => {
		const newTheme = current === 'light' ? 'dark' : 'light';
		if (browser) {
			localStorage.setItem('theme', newTheme);
			document.documentElement.classList.toggle('dark', newTheme === 'dark');
		}
		return newTheme;
	});
}
