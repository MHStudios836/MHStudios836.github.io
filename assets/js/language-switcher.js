let translations = {};
const BODY = document.body; // Reference to the body element

// --- Core Translation Functions ---

function updateText(lang) {
  // 1. Update text content (data-translate)
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    const keys = key.split('.');
    let value = translations;
    
    // Safely traverse the JSON object
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        value = null; // Key not found, stop traversal
        break;
      }
    }

    if (value) {
      element.textContent = value;
    } 
  });

  // 2. Update placeholders (data-translate-placeholder)
  document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    const keys = key.split('.');
    let value = translations;
    
    // Safely traverse the JSON object
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
    
    if (value) {
      element.placeholder = value;
    }
  });

  // 3. Handle RTL for Arabic
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  BODY.style.textAlign = lang === 'ar' ? 'right' : 'left';
}


// 🔥 CRITICAL FIX: Using async/await to force the browser to WAIT for the file.
async function loadTranslations(lang) {
  // *** DELETE THE filePath VARIABLE LINE ***
  
  try {
    // 1. PRIMARY FETCH: Use the correct RELATIVE path: "json/en.json" (no leading slash)
    const response = await fetch(`../json/${lang}.json`);

    if (!response.ok) {
      console.warn(`Translation file not found or failed to load: ${lang}.json. Status: ${response.status}. Falling back to English.`);
      
      // Fallback to English - Must also use the correct RELATIVE path: "json/en.json"
      const enResponse = await fetch(`../json/en.json`);
      if (!enResponse.ok) {
        console.error("Fatal Error: Could not load 'en.json' fallback file.");
        return;
      }
      translations = await enResponse.json();
    } else {
      translations = await response.json();
    }
    
    // 1. Update text
    updateText(lang);
    
    // 2. CRITICAL: Remove the loading class to reveal the page (in the correct language)
    BODY.classList.remove('is-loading');

  } catch (error) {
    console.error('Network Error loading translations:', error);
    // Always reveal the page, even if translations failed, to prevent a blank screen
    BODY.classList.remove('is-loading');
  }
}

function setActiveButton(lang) {
  // 1. Remove 'active' class from all buttons across the entire page
  document.querySelectorAll('.lang-btn-flag').forEach(button => {
    button.classList.remove('active');
  });

  // 2. Add 'active' class to the correct button(s)
  const langButton = document.getElementById(`lang-${lang}`);
  if (langButton) {
      langButton.classList.add('active');
  }
}

function changeLanguage(lang) {
  localStorage.setItem('language', lang);
  setActiveButton(lang);
  loadTranslations(lang);
}

// --- Initialization and Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('language') || 'en';
  
  // 🔥 CRITICAL FIX: This line initiates the load on page launch.
  changeLanguage(savedLang); 

  // FIX: Use robust event delegation for flag clicks
  document.addEventListener('click', (event) => {
    const targetButton = event.target.closest('.lang-btn-flag');
    
    if (targetButton) {
      event.preventDefault();
      event.stopPropagation();
      
      const lang = targetButton.id.replace('lang-', '');
      changeLanguage(lang);

      // CRITICAL: Manually hide the off-canvas menu for the Forty theme
      document.body.classList.remove('is-menu-visible'); 
    }
  });
});