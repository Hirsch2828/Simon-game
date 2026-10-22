import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icons are generated once from public/icon.svg and committed (ADR-7)
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0A1628', fit: 'contain' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0A1628', fit: 'contain' } },
  },
  images: ['public/icon.svg'],
});
