// i18n.js
import { writable, derived } from 'svelte/store';
import en from '../../../locale/en.json';
import fr from '../../../locale/fr.json';
import tr from '../../../locale/tr.json';
import es from '../../../locale/es.json';

const locales = { en, fr, tr, es};

export const currentLocale = writable('en');

export const translations = derived(currentLocale, $locale => {
  return locales[$locale] || locales.en;
});

// ✅ t is now a derived store that takes a key and returns a translation
export const t = derived(translations, $translations => {
  return (key) => {
    return key.split('.').reduce((obj, part) => obj?.[part], $translations) || key;
  };
});