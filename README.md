# Health Self-Check Kiosk

A walk-up wellness kiosk built for Laboratory 5 (IT Elective, DLSU-D ICS). A user
enters their name, age, sex, weight, and height; the app computes BMI, classifies
it into a health category, shows a tailored recommendation on a vitals-monitor
style gauge, and records the submission to a shared Google Sheet for the school
nurse/HR office to review.

## Live demo

`https://<your-github-username>.github.io/health-checker-kiosk/`
_(fill in after enabling GitHub Pages — see Part F of the lab guide)_

## Running locally

No build step required. Just open `index.html` in a browser, or serve the folder
with any static server (e.g. the VS Code "Live Server" extension).

## Project structure

```
health-checker-kiosk/
├── index.html          Form + result markup
├── style.css            Dark "vitals monitor" theme, responsive layout
├── script.js             Validation, BMI logic, gauge animation, Sheet sync
├── apps-script.gs        Reference backend code for the Google Sheet
├── SETUP_GUIDE.md         Step-by-step guide to connect Sheets + Apps Script
└── README.md
```

## Google Sheet

Submissions are recorded to **BMI Kiosk Records**:
https://docs.google.com/spreadsheets/d/1c4hnJabpWNuxMesHgPuPh3oujAzPB-JsjlpMNsxFoIM/edit

Apps Script Web App URL: `[<paste your deployed URL here for the submission doc>](https://script.google.com/macros/s/AKfycbyyYjw7dykia0zPiaZELhK0MoauGPitXeWq6--bj11m6U8PD1iXB9RjkMpCxC38ajkO/exec)`

## Control structures used

**if-else** — In `script.js`, after the required-field check, `age`, `weight`,
and `height` are validated with a chained `if / else if / else` block that
rejects non-numeric or out-of-range values (e.g. `age <= 0`) before any BMI
math runs. Without it, invalid input like a blank height would produce
`NaN` or `Infinity` for the BMI and silently show a broken result.

**switch-case** — The computed BMI is classified with `switch (true)` against
the four category ranges (Underweight / Normal / Overweight / Obese), each
mapping to its own message, badge color, and gauge color. Without it, the
same mapping would need a much longer if/else-if chain to express the same
four-way branch, which is exactly what switch-case is designed to read more
clearly.

**loop** — Two loops are used: a `for...of` loop walks the list of required
fields to validate all five in a single pass (rather than five separate
if-statements), and a `forEach` loop renders every entry in the session log
list. Without the first loop, adding or removing a required field would mean
manually editing repeated validation code instead of just updating one array.
