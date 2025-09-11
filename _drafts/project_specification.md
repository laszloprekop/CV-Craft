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

### App UI
- Two-column layout, 35/65% default, adjustable with drag handle
- Responsive design
- Light/Dark mode

#### Left column - Markdown editor
- Header: CV manager Icon, Markdown file Import/Export, Profile photo upload
- Body: Markdown editor

#### Right column - CV preview and tools
- Header Left:
    - Template selector
    - Template settings icon with color palette preview
        - Title and body font size
        - Title and body font family
        - CV surface colors
        - Accent color
        - Use tag design for skills and interests toggle
        - Use underlined links toggle
        - Separator line style selector
        - Page numbering toggle
        - Date toggle
        - Emojis style selector (emoji font, replace with Phosphor icons, Lucide icons, etc.)
        - editable page paddings for page/pdf mode
- Header Center:
    - Zoom in/out icon
    - Zoom to fill width icon
    - Zoom to fit height icon
    - Zoom to 1:1 (show actual a4 size on screen)
    - Web / PDF preview toggle (continuous / page)
    - Save icon (autosave)
- Header Right:
    - PDF export icon
    - Web package export icon
    - Save icon (autosave)
- Body: Rendered CV preview

### Templates

- implement a default template
- should automatically flow content into the columns and add new pages as needed
- should ensure that Keep-Together blocks are not broken by page breaks
- can be added manually by developer
- list the avaliable templates in the template selector
- responsive, mobile-first design
- light / dark mode
- automatically refresh preview when content or template settings are changed
- preview can be shown as continuous (website) or page (PDF print)
- in the page preview mode should render the page as it would be printed, taking page top/bottom margins into account and include page numbering

### Data storage
- serverless database (SQLite?)
- cv setting/content: assets, parsed content and generated CV are stored

## Project Technical Requirements
- Pick frameworks and tools which are easy for Claude Code to work with and debug errors (to ensure token-efficient, fast-paced development and minimize bugs, model decay and AI drift).

## Reference Markdown source files
- _drafts/laszlo_android_cv.md
- _drafts/laszlo_frontend_cv.md

## Reference CV template PDF file and page images
- _drafts/CV_sample.pdf
- _drafts/CV_sample-page1.jpg
- _drafts/CV_sample-page2.jpg
- _drafts/CV_sample-page3.jpg

## App UI design proposal
- _drafts/design_proposal.png
