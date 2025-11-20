import htmFactory from './htm-core.js';
import { h } from './preact.module.js';

export const html = htmFactory.bind(h);
