import { escape as escape501 } from 'escape-5-0-1'

import { bench, describe } from 'vitest'
import { escape as escapeLocal } from '../../packages/escape/src'

const commonSelectors = [
  'btn-primary',
  'nav__item--active',
  'form-input[type="text"]#field',
  'menu-item[aria-expanded=true]',
  'card__title',
  'grid-cols-12 md:grid-cols-6 lg:grid-cols-4',
  'dialog[data-state=open] .dialog__close',
  'list-item:nth-child(2n+1)',
  'tooltip[data-side="top"] .arrow',
  'badge--success',
  'header nav > ul > li > a',
  'footer .social-links a[href^="https"]',
  'checkbox:checked + label',
  '.is-visible',
  '.is-hidden',
  '.btn--ghost',
  '.link[href*="utm_source"]',
  '.tag[data-variant="warning"]',
]

// 95% common selectors, ~5% leading hyphen/digit.
const weightedSelectors = [
  ...Array.from({ length: 38 }, (_, index) => commonSelectors[index % commonSelectors.length]),
  '-leading-hyphen',
  '1leading-digit',
]

describe('@weapp-core/escape escape weighted mix (~5% leading hyphen/digit)', () => {
  bench('escape weighted selectors (local)', () => {
    for (const selector of weightedSelectors) {
      escapeLocal(selector)
    }
  })

  bench('escape weighted selectors (5.0.1)', () => {
    for (const selector of weightedSelectors) {
      escape501(selector)
    }
  })
})
