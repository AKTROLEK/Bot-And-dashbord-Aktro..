const fs = require('fs');
const path = require('path');

const locales = new Map();
const localesPath = path.join(__dirname, '..', 'locales');
const localeFiles = fs.readdirSync(localesPath).filter(file => file.endsWith('.json'));

for (const file of localeFiles) {
    const locale = file.split('.')[0];
    const data = fs.readFileSync(path.join(localesPath, file), 'utf8');
    locales.set(locale, JSON.parse(data));
}

// الدالة الرئيسية لجلب النصوص
function t(key, locale = 'en') {
    const languageFile = locales.get(locale) || locales.get('en');
    return languageFile[key] || key;
}

// دالة لجلب كل الترجمات لاسم معين (مفيد لأسماء الأوامر)
function getAllTranslations(key) {
    const translations = {};
    for (const [locale, data] of locales.entries()) {
        if (data[key]) {
            translations[locale] = data[key];
        }
    }
    return translations;
}

module.exports = { t, getAllTranslations, locales };
