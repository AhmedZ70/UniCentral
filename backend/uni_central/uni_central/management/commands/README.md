# University of Utah Scraper

This directory contains Django management commands for scraping course and professor data from various sources and adding them to the UniCentral database.

## `uofu_scraper.py`

This command scrapes courses and professors from the University of Utah class schedule and adds them to the database.

### Usage

```bash
# Scrape all departments (using hardcoded list)
python manage.py uofu_scraper

# Limit to a specific number of departments
python manage.py uofu_scraper --limit 5

# Debug mode (with more output)
python manage.py uofu_scraper --debug

# Force update of existing records
python manage.py uofu_scraper --force-update

# Use a different term (default is 1258 for Fall 2025)
python manage.py uofu_scraper --term 1254

# Increase delay between requests to reduce server load
python manage.py uofu_scraper --delay 2.0
```

### Options

- `--term`: The term code to scrape (default: 1258 for Fall 2025)
- `--limit`: Limit the number of departments to scrape (0 for all)
- `--delay`: Delay between requests in seconds (default: 1.0)
- `--debug`: Print debug information during scraping
- `--force-update`: Force update existing records with new data

### What it does

1. Scrapes department information from the UofU course catalog
2. For each department, scrapes all courses and their instructors
3. Adds departments, courses, and professors to the database
4. Creates associations between professors and their courses

### Notes

- The scraper handles duplicate detection, so it's safe to run multiple times
- If no departments are found from the web page, a small hardcoded list is used
- Professors with "TBA" or "STAFF" designations are ignored
- Currently includes: Computer Science, Mathematics, and Physics departments

## `course_scraper.py`

An older command that only scrapes course information but does not gather professor data. Use `uofu_scraper.py` instead for more comprehensive data gathering. 