/**
 * Localization System
 * 
 * This module provides two-level localization support:
 * 
 * 1. Command Registration (Discord API level):
 *    - Uses only Discord-supported locales (no Arabic support from Discord)
 *    - Command names and descriptions will appear in English
 *    - This limitation is imposed by Discord's API
 * 
 * 2. User-Facing Messages (Bot level):
 *    - Supports ALL languages including Arabic
 *    - Embeds, replies, and responses can be in Arabic
 *    - Determined by user's locale preference
 * 
 * Note: Discord does not support Arabic in command localization,
 * so commands will have English names, but responses can be in Arabic.
 */

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

// Discord.js supported locales (Discord API v10)
// Arabic is NOT supported by Discord for command localization
const DISCORD_SUPPORTED_LOCALES = [
    'id', 'en-US', 'en-GB', 'bg', 'zh-CN', 'zh-TW', 'hr', 'cs', 'da', 
    'nl', 'fi', 'fr', 'de', 'el', 'hi', 'hu', 'it', 'ja', 'ko', 'lt', 
    'no', 'pl', 'pt-BR', 'ro', 'ru', 'es-ES', 'es-419', 'sv-SE', 'th', 
    'tr', 'uk', 'vi'
];

// Map our locale codes to Discord locale codes
const LOCALE_MAP = {
    'en': 'en-US',
    'ar': null  // Arabic not supported by Discord
};

// الدالة الرئيسية لجلب النصوص
function t(key, locale = 'en') {
    const languageFile = locales.get(locale) || locales.get('en');
    return languageFile[key] || key;
}

// دالة لجلب كل الترجمات لاسم معين (مفيد لأسماء الأوامر)
// Returns only Discord-supported locales for command registration
function getAllTranslations(key) {
    const translations = {};
    for (const [locale, data] of locales.entries()) {
        if (data[key]) {
            // Map to Discord locale code
            const discordLocale = LOCALE_MAP[locale] || locale;
            
            // Only include if supported by Discord
            if (discordLocale && DISCORD_SUPPORTED_LOCALES.includes(discordLocale)) {
                translations[discordLocale] = data[key];
            }
        }
    }
    return translations;
}

module.exports = { t, getAllTranslations, locales };
