// ==UserScript==
// @name         Pinterest Raw Image Unlocker (by Mohammed Sami)
// @namespace    https://github.com/MohdSamiS
// @version      2.0.0
// @license      MIT
// @description  Automatically replaces Pinterest’s compressed or resized images with their full-resolution originals (or the largest available), supporting dynamic loading and WebP.
// @author       Mohammed Sami
// @match        https://*.pinterest.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  const REGEX = /^(https?:\/\/i\.pinimg\.com)\/\d+x(\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{32}\.(?:jpg|png|webp))$/i;
  const PROCESSED = new WeakSet();

  /** Try replacing an image with its original or fallback version */
  const tryReplace = (img, base, path) => {
    if (PROCESSED.has(img)) return;
    PROCESSED.add(img);

    const originalURL = `${base}/originals${path}`;
    const fallbackURL = `${base}/736x${path}`;

    const testImg = new Image();
    testImg.ref = img;

    testImg.onload = () => {
      img.src = testImg.src;
      testImg.remove();
    };

    testImg.onerror = () => {
      if (testImg.src === originalURL) {
        testImg.src = fallbackURL;
      } else {
        testImg.remove();
      }
    };

    testImg.src = originalURL;
  };

  /** Process a single image element */
  const processImage = (img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.rawChecked) return;
    img.dataset.rawChecked = 'true';

    // Handle lazy-loaded Pinterest images
    const src = img.currentSrc || img.src || img.dataset.src || img.dataset.lazySrc;
    if (!src) return;

    const match = src.match(REGEX);
    if (match) tryReplace(img, match[1], match[2]);
  };

  /** Process all images in a given container */
  const processContainer = (container) => {
    if (!(container instanceof HTMLElement)) return;
    const imgs = container.querySelectorAll('img[src*="i.pinimg.com"]');
    imgs.forEach(processImage);
  };

  /** Observe changes for dynamically loaded images */
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        processImage(mutation.target);
      }
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.tagName === 'IMG') processImage(node);
          else processContainer(node);
        }
      }
    }
  });

  /** Initialize on load */
  window.addEventListener('load', () => {
    processContainer(document.body);
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['src']
    });
  });
})();
