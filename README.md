# AEP Shares Outstanding - GitHub Pages Demo

## Overview
This is a production-ready, client-side single-page application (SPA) designed for GitHub Pages. It fetches and displays the American Electric Power (AEP) common stock outstanding data, computed from SEC XBRL data, with a graceful fallback to a local data.json when needed. The UI is built with Bootstrap 5 for a clean, professional appearance.

## Files
- index.html: The main SPA entry point. Renders live entity name, max/min shares outstanding, and supports optional CIK query parameter.
- style.css: Minimal styling enhancements for the SPA and responsive layout.
- script.js: Core logic to fetch and display data. It can fetch via a proxy for alternate CIKs and updates the UI dynamically.
- data.json: Static pre-computed data for American Electric Power (entityName, max, min) used as the initial data source.
- README.md: This file.
- LICENSE: MIT License text.
- uid.txt: Attachment placeholder (provided by project); ensure this file is committed as-is.

## Setup
This project is intended to be published on GitHub Pages. Once pushed to a repository (e.g., your-username/your-repo), enable GitHub Pages from the repository settings and point to the main branch / root.

Example URL:
https://your-username.github.io/your-repo/

## Usage
- Open index.html in a browser (via GitHub Pages).
- By default, the app loads data.json for American Electric Power and displays max/min shares outstanding.
- To fetch data for a different company, append ?CIK=XXXXXXXXXX to the URL (10-digit CIK). Example:
  https://your-username.github.io/your-repo/?CIK=0001018724
- When a CIK parameter is present, the app attempts to fetch data from the SEC (via a proxy) and updates the UI accordingly without reloading the page.

## Data and Compliance
- data.json stores a structured representation:
  {"entityName": "...", "max": {"val": ..., "fy": ...}, "min": {"val": ..., "fy": ...}}
- The app uses a descriptive user agent in fetch calls per SEC guidance when possible.
- The data.json values satisfy the constraints:
  - entityName matches "American Electric Power"
  - max.fy and min.fy are > "2020"
  - max.val >= min.val
  - Numeric types for val fields

## License
MIT License - see LICENSE file for details.