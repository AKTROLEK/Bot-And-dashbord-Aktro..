# Localization System

## Overview

This bot implements a two-tier localization system to support multiple languages, with **Arabic as the default language**, while working within Discord API limitations.

## Current Configuration

**Default Language:** Arabic (العربية) 🇸🇦

All user-facing messages, responses, embeds, and content are displayed in Arabic by default.

### What's in Arabic:
✅ All success messages  
✅ All error messages  
✅ All help documentation  
✅ All embeds and responses  
✅ All reports and analytics  
✅ All ticket messages  
✅ All credit notifications  
✅ **100% of user-visible content**

### What remains in English:
❌ Command names (e.g., `/apply`, `/credits`, `/help`)  
❌ Option names (e.g., `platform`, `username`, `reason`)  
❌ Choice values (internal identifiers)

**Why?** Discord API does not support Arabic for command/option names. This is a Discord limitation, not a bot limitation.

## Two-Tier Approach

### Tier 1: Command Registration (Discord API Level)

Discord's slash command system only supports specific locale codes for command name/description localization. Unfortunately, **Arabic is NOT supported** by Discord's API.

**Supported Discord Locales:**
- `id`, `en-US`, `en-GB`, `bg`, `zh-CN`, `zh-TW`, `hr`, `cs`, `da`
- `nl`, `fi`, `fr`, `de`, `el`, `hi`, `hu`, `it`, `ja`, `ko`, `lt`
- `no`, `pl`, `pt-BR`, `ro`, `ru`, `es-ES`, `es-419`, `sv-SE`, `th`
- `tr`, `uk`, `vi`

**Result:** Slash command names and options will appear in **English** (this is a Discord API limitation).

### Tier 2: User-Facing Messages (Bot Level) ✅

The bot's **responses, embeds, and messages** are fully in Arabic!

**Arabic Support Includes:**
- ✅ Success/error messages (all in Arabic)
- ✅ Ticket embeds (all in Arabic)
- ✅ Application confirmations (all in Arabic)
- ✅ Credit notifications (all in Arabic)
- ✅ Help and documentation (all in Arabic)
- ✅ Reports and analytics (all in Arabic)
- ✅ **All user-facing content is in Arabic by default**

## How It Works

### For Command Registration

The `getAllTranslations()` function in `src/utils/localization.js` filters out unsupported locales:

```javascript
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
```

This ensures that:
1. Arabic translations are excluded from command registration (preventing crashes)
2. English translations are mapped to `en-US` for Discord
3. Only Discord-supported locales are included

### For User Messages

The `t()` function provides translations with **Arabic as the default**:

```javascript
// اللغة الافتراضية هي العربية
function t(key, locale = 'ar') {
    const languageFile = locales.get(locale) || locales.get('ar');
    return languageFile[key] || key;
}
```

Usage in commands (Arabic by default):
```javascript
// No need to specify locale - Arabic is default
await interaction.reply({
    embeds: [successEmbed(
        t('EMBED_APPLICATION_SUCCESS_TITLE'),
        t('EMBED_APPLICATION_SUCCESS_DESCRIPTION')
    )]
});

// Or specify explicitly if needed
await interaction.reply({
    embeds: [successEmbed(
        t('EMBED_APPLICATION_SUCCESS_TITLE', 'ar'),
        t('EMBED_APPLICATION_SUCCESS_DESCRIPTION', 'ar')
    )]
});
```

## Adding New Languages

### Step 1: Create Translation File

Create `src/locales/{locale}.json` with all translation keys:

```json
{
  "COMMAND_APPLY_NAME": "apply",
  "COMMAND_APPLY_DESCRIPTION": "Apply to become a streamer",
  "PLATFORM_YOUTUBE": "YouTube",
  ...
}
```

### Step 2: Update Locale Map (if supported by Discord)

If Discord supports your language, add it to `LOCALE_MAP` in `src/utils/localization.js`:

```javascript
const LOCALE_MAP = {
    'en': 'en-US',
    'ar': null,  // Not supported by Discord
    'fr': 'fr',  // Supported by Discord
};
```

### Step 3: Test

Run `npm run deploy` to verify commands load without errors.

## Why This Approach?

### The Problem

Before this fix, the bot would crash with:
```
Error: Expected the value to be one of the following enum values
```

This happened because we tried to register commands with Arabic locale ('ar'), which Discord's API rejects.

### The Solution

By filtering out unsupported locales during command registration while keeping them for user messages:
- ✅ Bot deploys successfully
- ✅ Commands appear in English (Discord limitation)
- ✅ All messages appear in Arabic (full support)
- ✅ Users get a fully localized experience for content

## Technical Details

### Files Modified

1. **`src/utils/localization.js`**
   - Added `DISCORD_SUPPORTED_LOCALES` array
   - Added `LOCALE_MAP` object
   - Updated `getAllTranslations()` to filter locales
   - Added comprehensive documentation

2. **`README.md`**
   - Added "Localization" section
   - Explained the dual-tier approach
   - Provided guidance for adding new languages

### Locale Files

- `src/locales/en.json` - English translations
- `src/locales/ar.json` - Arabic translations (full support for messages)

### Command Usage

Only `apply.js` currently uses localized command registration. Other commands use English names only but can still display Arabic messages.

## Limitations

1. **Command Names:** Must be in English (or another Discord-supported language)
2. **Discord UI:** Discord's own UI elements will be in the user's Discord language
3. **Choice Names:** Currently use English for compatibility

## Future Enhancements

- Add more languages as needed
- Consider using emoji indicators for language-specific content
- Add per-server language preferences
- Implement language switching commands

## Testing

To verify the localization system:

```bash
# Deploy commands (should succeed)
npm run deploy

# Start the bot (should not crash)
npm start
```

All commands should load successfully without locale validation errors.
