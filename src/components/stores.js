import { writable } from 'svelte/store';

export const name = writable(0);
export const photo = writable(0);
export const animal = writable('Pug');