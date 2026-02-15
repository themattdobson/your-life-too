# CLAUDE.md

## Project Overview
"Your Life in Weeks" — a static web app that visualizes your life as a grid of weeks (also months/years). Forked from [bryanbraun/your-life](https://github.com/bryanbraun/your-life) with added week notes functionality.

**Live site:** https://themattdobson.github.io/your-life-too/weeks.html

## Architecture
- Pure HTML/CSS/JS — no build tools, no bundler, no framework
- Single shared stylesheet (`your-life.css`) and script (`your-life.js`)
- Multiple pages: `index.html`, `weeks.html`, `months.html`, `years.html`
- EasyMDE loaded via CDN for the markdown editor (CSS in `<head>`, JS before `your-life.js`)
- All data stored in `localStorage` (`DOB` for date of birth, `weekNotes` for notes)

## Key Features (weeks page)
- **Week notes:** Click any week dot to add/view a markdown note with optional title
- **Two-mode modal:** Read view (rendered markdown) and edit view (EasyMDE WYSIWYG editor)
- **Auto-save:** Notes save to localStorage 500ms after typing stops
- **Export/Import:** JSON backup download and restore
- **Auto-backup:** File System Access API writes to a user-chosen file on every save (Chrome/Edge only)
- **Tooltips:** Hover shows age, week number, dates, and note title
- **Mobile:** Bottom-sheet modal with visualViewport keyboard handling; nearest-neighbor tap matching for small week dots

## Week Date Calculation
The chart uses 52 weeks per year aligned to birthdays (not calendar weeks). `_getWeekDates()` derives dates from the birthday for each year row plus the week offset. This matches `calculateElapsedTime()` which counts 52 weeks per elapsed year.

## Note Storage Format
Notes in `weekNotes` localStorage can be:
- A plain string (body only, legacy format)
- An object `{ title: string, body: string }` (when title is set)

`_parseNote()` handles both formats for backward compatibility.

## Conventions
- No ES6+ — the codebase uses `var`, function expressions, and ES5 patterns
- All week notes logic is inside the `if (unitText === 'weeks')` block in `your-life.js`
- CSS follows existing section-comment style (`/** Section Name */`)
- Branch: `gh-pages` (deployed via GitHub Pages)
