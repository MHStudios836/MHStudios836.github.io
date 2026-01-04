/* assets/js/sound-engine.js */

const SOUND_PATH = 'assets/sounds/';

const library = {
    notify: new Audio(`${SOUND_PATH}notify.mp3`),
    hover: new Audio(`${SOUND_PATH}hover.mp3`),
    type: new Audio(`${SOUND_PATH}terminal_type.mp3`),
    granted: new Audio(`${SOUND_PATH}access_granted.mp3`),
    deny: new Audio(`${SOUND_PATH}access_denied.mp3`) // Optional: for errors
};

// Configure volumes (keep them low so they don't scare the user!)
library.notify.volume = 0.4;
library.hover.volume = 0.2;
library.type.volume = 0.1;
library.granted.volume = 0.5;

/**
 * PLAY SOUND EFFECT
 * @param {string} key - The name of the sound in the library
 */
export function playSound(key) {
    if (library[key]) {
        // Reset sound to start if it's already playing (allows rapid fire)
        library[key].currentTime = 0;
        library[key].play().catch(e => console.warn("Audio playback blocked until user interacts with page."));
    }
}

/**
 * ATTACH HOVER SOUNDS TO ELEMENTS
 * @param {string} selector - CSS Selector (e.g., '.sector-btn')
 */
export function attachHoverSounds(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.addEventListener('mouseenter', () => playSound('hover'));
    });
}