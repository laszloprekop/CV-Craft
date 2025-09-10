# Static CV Generator

## Project Description


Create a webapp which is based on standardized structured Markdown files and can create static CV websites and PDFs using styled templates

## Project Features

### CV management

- create a new CV instance (configuration)
- upload/modify assets like the Markdown file, photo
- apply a template
- parse Markdown content into structured data
- generate standalone static webpage package
- export as PDF, filename "FirstName_LastName_CV.pdf
- save CV content and settings for future reload
- duplicate CV instance for tweaking
- archive CV instance
- delete CV instance and assets from database (check dependecies)

### Templates

- implement a default template
- should automatically flow content into the columns and add new pages as needed
- should ensure that Keep-Together blocks are not broken by page breaks
- can be added manually by developer
- list the avaliable templates in the template selector
- responsive, mobile-first design
- light / dark mode
- can be previewed next to the Markdown source
- preview can be shown as continuous (reading) or page (print preview)
- in the continuous preview should show page break points, but don't add any margins or padding where the break would occur
- in the page preview should render the page as it would be printed, taking page top/bottom margins into account and include page numbering

### Data storage
- in a serverless database
- cv configuration/context: assets, parsed content and generated CV are stored

## Project Technical Requirements
- Pick frameworks and tools which are easy for Claude Code to work with and debug errors (to ensure token-efficient, fast-paced development and minimize bugs, model decay and AI drift).
