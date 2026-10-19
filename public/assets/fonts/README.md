# Self-hosted Barlow fonts

These unmodified WOFF2 files are the same Google Fonts faces previously requested by the website. They are served locally to remove the visitor's Google Fonts stylesheet and font-origin dependencies. The site retains its existing Barlow, Barlow Condensed and Barlow Semi Condensed typography.

## Sources and license

- [Google Fonts CSS request](https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Barlow+Semi+Condensed:wght@600;700&display=swap)
- [Barlow source and license](https://github.com/google/fonts/tree/main/ofl/barlow)
- [Barlow Condensed source and license](https://github.com/google/fonts/tree/main/ofl/barlowcondensed)
- [Barlow Semi Condensed source and license](https://github.com/google/fonts/tree/main/ofl/barlowsemicondensed)
- [Original Barlow project](https://github.com/jpt/barlow)
- [Astro fonts guide](https://docs.astro.build/en/guides/fonts/)

Copyright 2017 The Barlow Project Authors. All three families use the identical SIL Open Font License 1.1 copied in `OFL.txt`. `manifest.json` records each file's original URL, SHA-256, byte size and retrieval time.

## Scope and loading

`/fonts.css` retains every originally requested normal weight: Barlow 400/500/600/700, Barlow Condensed 500/600/700/800, and Barlow Semi Condensed 600/700. Google Fonts currently supplies these as static faces, so no synthetic variable conversion was performed.

Latin and Latin Extended subsets retain the Google-provided Unicode ranges. Latin includes Spanish accented letters, ñ and inverted punctuation; Extended remains available for other names and text. Vietnamese-only subsets are omitted because the site supports English and Spanish. Browsers request only faces and subsets needed for rendered text. Each declaration keeps `font-display: swap` so text remains visible while the font loads.

Load the stylesheet once in the page head after removing the Google Fonts stylesheet and Google Fonts preconnects:

```html
<link rel="stylesheet" href="/fonts.css">
```

If preloading, limit it to essential first-screen faces. The headline is `/assets/fonts/barlow-condensed-v13-800-latin.woff2` (22,464 bytes); regular body text is `/assets/fonts/barlow-v13-400-latin.woff2` (22,196 bytes). Font preloads require `as="font" type="font/woff2" crossorigin`; do not preload all 20 subsets and weights.

## Measured footprint

The original Google CSS response was 12,994 uncompressed bytes. The local equivalent is 8,678 uncompressed bytes after removing Vietnamese-only declarations. Font binaries are byte-for-byte copies, not smaller replacements: all 20 stored files total 370,928 bytes, of which the 10 Latin files total 224,632 bytes. Actual transfer depends on the weights/subsets used and the browser cache. The improvement is avoiding the cross-origin stylesheet/font connection chain and making first-screen font discovery possible directly from the document; no page-load time improvement is claimed without measurement on the deployed site.
