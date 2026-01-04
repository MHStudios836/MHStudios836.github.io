/* assets/js/ui-terminal-fx.js */

/**
 * TACTICAL TYPING EFFECT
 * @param {HTMLElement} element - The target DOM element
 * @param {string} text - The string to type
 * @param {number} speed - Delay between chars (ms)
 */
export function typeOut(element, text, speed = 30) {
    let i = 0;
    element.innerHTML = ""; // Clear existing
    
    return new Promise((resolve) => {
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
}

/**
 * SATELLITE DECRYPTION EFFECT (Random gibberish settling into text)
 * @param {HTMLElement} element - Target element
 * @param {string} finalValue - The actual text to reveal
 */
export function decryptEffect(element, finalValue) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
    const iterations = 10;
    let count = 0;
    
    const interval = setInterval(() => {
        element.innerText = finalValue.split("")
            .map((char, index) => {
                if (index < count) return finalValue[index];
                return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("");

        if (count >= finalValue.length) {
            clearInterval(interval);
        }
        count += finalValue.length / iterations;
    }, 50);
}

/**
 * SYSTEM LOG FEED (For your Terminal Window)
 * @param {HTMLElement} container - The terminal box
 * @param {string} message - The log entry
 * @param {string} type - 'info', 'warn', 'error'
 */
export function logToTerminal(container, message, type = 'info') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const entry = document.createElement('div');
    entry.style.marginBottom = '5px';
    
    // Color logic based on type
    let color = 'var(--mh-green)'; // Default info
    if (type === 'warn') color = 'var(--mh-orange)';
    if (type === 'error') color = 'var(--mh-red)';

    entry.innerHTML = `<span style="color:#666">[${time}]</span> <span style="color:${color}">></span> <span class="typing-text"></span>`;
    container.appendChild(entry);
    
    const textSpan = entry.querySelector('.typing-text');
    typeOut(textSpan, message, 20);
    
    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}