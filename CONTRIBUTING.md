# Contributing

Thanks for contributing to Zakat Calculator.

The goal of this project is not just to calculate numbers. It is to give users a clean, trustworthy, and practical zakat experience that feels simple even when the subject matter is not.

## What kind of contributions are welcome

- UI and UX improvements
- Accessibility improvements
- Calculation clarity improvements
- Bug fixes
- Test coverage improvements
- Documentation improvements
- SEO and metadata improvements
- Performance and mobile usability improvements

## Before you start

Please keep these project priorities in mind:

- Clarity over cleverness
- Mobile-first usability
- Clean one-page app experience
- Honest presentation of fiqh-sensitive choices
- Lightweight implementation over unnecessary complexity

## Local setup

Requirements:

- Node.js 18+

Install and run:

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:4173
```

Run tests:

```bash
npm test
```

## Development guidelines

- Keep the UI clean and compact.
- Avoid adding unnecessary text to the main journey.
- Prefer progressive disclosure over clutter.
- Preserve mobile usability when changing desktop layouts.
- Do not silently change the zakat methodology without documenting it.
- If a contribution affects calculation behavior, explain the reasoning clearly in the PR.
- If a contribution changes the UI, include screenshots.

## Design expectations

- The app should feel easy for a non-technical user.
- Avoid long-scroll layouts for the main calculator journey.
- Keep spacing, padding, and field rhythms consistent.
- Do not add interface noise unless it clearly improves usability.
- If you introduce a new pattern, make sure it works on both desktop and mobile.

## Calculation expectations

- Be explicit about what is included and excluded.
- Keep disputed issues visible as choices where appropriate.
- Do not present the calculator as a fatwa engine.
- Preserve transparency in the result and breakdown.

## Pull request checklist

Before opening a PR, please make sure:

- the app runs locally
- tests pass with `npm test`
- the main flow works from landing page to final result
- mobile layout still works
- print or PDF export still works if you touched the result view
- screenshots are included for meaningful UI changes
- documentation is updated when behavior changes

## Suggested PR format

Please include:

- what changed
- why it changed
- screenshots if UI changed
- any calculation or fiqh assumptions affected
- how you tested it

## Areas where help is especially valuable

- accessibility review
- stronger automated browser coverage
- clearer onboarding copy
- better export and sharing workflows
- design refinements that reduce clutter without losing trust
- internationalization and more currency support

## Questions and discussion

If you are planning a larger change, open an issue or start a discussion first so the direction stays aligned with the product goals.

## Code of contribution

Be respectful, be clear, and optimize for usefulness. This project deals with a religious financial obligation, so correctness, clarity, and user trust matter more than novelty.
