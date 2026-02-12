/**
 * CV Parser Library
 *
 * Parses structured Markdown files into CV data using Remark ecosystem.
 * Extracts frontmatter and converts content sections into structured format.
 * Enhanced with Unified/Rehype for HTML generation with embedded styles.
 */

import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import matter from 'gray-matter';
import type {
  ParsedCVContent,
  CVFrontmatter,
  CVSection,
  CVExperienceItem,
  CVEducationItem,
  CVListItem,
  TemplateConfig
} from '../../../../shared/types';
import { generateCSSVariables } from '../../../../shared/utils/cssVariableGenerator';

export interface CVParserOptions {
  strictFrontmatter?: boolean;
  validateRequired?: boolean;
  extractMetadata?: boolean;
}

export class CVParser {
  private processor;

  constructor(private options: CVParserOptions = {}) {
    this.processor = remark()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml', 'toml']);
  }

  /**
   * Parse CV Markdown content into structured data
   * Enhanced to generate HTML with embedded styles using Unified/Rehype
   */
  async parse(content: string, config?: TemplateConfig): Promise<ParsedCVContent> {
    try {
      // Extract frontmatter using gray-matter
      const { data: frontmatter, content: markdownContent } = matter(content);

      // Validate frontmatter
      let validatedFrontmatter = this.validateFrontmatter(frontmatter);

      // Parse markdown content into AST
      const tree = this.processor.parse(markdownContent);

      // Extract sections from AST (legacy support)
      const sections = this.extractSections(tree);

      // If no frontmatter provided, try to extract contact info from content
      if (Object.keys(validatedFrontmatter).length === 0) {
        validatedFrontmatter = this.extractContactFromContent(tree, validatedFrontmatter);
      }

      // Generate HTML with embedded styles (if config provided)
      let html: string | undefined;
      let cssVariables: Record<string, string> | undefined;

      if (config) {
        const htmlResult = await this.generateHTML(markdownContent, config);
        html = htmlResult.html;
        cssVariables = htmlResult.cssVariables;
      }

      return {
        frontmatter: validatedFrontmatter,
        sections, // Legacy support
        html,
        cssVariables
      };
    } catch (error) {
      throw new CVParserError(`Failed to parse CV content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate HTML from markdown with embedded template styles
   * Uses Unified/Rehype pipeline for consistent rendering
   */
  private async generateHTML(
    markdownContent: string,
    config: TemplateConfig
  ): Promise<{ html: string; cssVariables: Record<string, string> }> {
    const cssVariables = generateCSSVariables(config);

    // Create HTML processor with Unified/Rehype
    // Sanitization schema: allow safe CV-relevant tags, block scripts/iframes/event handlers
    const sanitizeSchema = {
      ...defaultSchema,
      tagNames: [
        ...(defaultSchema.tagNames || []),
        'section', 'article', 'header', 'footer', 'nav',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'a', 'strong', 'em', 'b', 'i', 'u', 's', 'del',
        'code', 'pre', 'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div', 'img',
        'dl', 'dt', 'dd', 'sup', 'sub', 'small', 'mark',
      ],
      attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] || []), 'style', 'className'],
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
      },
    };
    const htmlProcessor = remark()
      .use(remarkParse)
      .use(remarkGfm) // GitHub Flavored Markdown (tables, strikethrough, etc.)
      .use(remarkRehype)
      .use(rehypeSanitize, sanitizeSchema)
      .use(() => (tree) => {
        // Apply template styles to HTML elements
        visit(tree, 'element', (node: any) => {
          this.applyTemplateStyles(node, config);
        });
      })
      .use(rehypeStringify);

    const file = await htmlProcessor.process(markdownContent);

    return {
      html: String(file),
      cssVariables
    };
  }

  /**
   * Apply template styles to HTML elements based on config
   * Injects CSS variables for consistent styling
   */
  private applyTemplateStyles(node: any, config: TemplateConfig): void {
    if (!node.tagName) return;

    const existingStyle = node.properties?.style || '';

    const styleMap: Record<string, string> = {
      h1: `
        font-family: var(--heading-font-family);
        font-size: var(--name-font-size);
        font-weight: var(--name-font-weight);
        color: var(--name-color);
        line-height: var(--heading-line-height);
        letter-spacing: var(--name-letter-spacing);
        text-transform: var(--name-text-transform);
        margin-bottom: var(--name-margin-bottom);
      `,
      h2: `
        font-family: var(--heading-font-family);
        font-size: var(--section-header-font-size);
        font-weight: var(--section-header-font-weight);
        color: var(--section-header-color);
        line-height: var(--heading-line-height);
        letter-spacing: var(--section-header-letter-spacing);
        text-transform: var(--section-header-text-transform);
        border-bottom: var(--section-header-border-bottom);
        border-color: var(--section-header-border-color);
        padding: var(--section-header-padding);
        margin-top: var(--section-header-margin-top);
        margin-bottom: var(--section-header-margin-bottom);
      `,
      h3: `
        font-family: var(--heading-font-family);
        font-size: var(--job-title-font-size);
        font-weight: var(--job-title-font-weight);
        color: var(--job-title-color);
        line-height: var(--heading-line-height);
        margin-bottom: var(--job-title-margin-bottom);
      `,
      h4: `
        font-family: var(--heading-font-family);
        font-size: var(--h3-font-size);
        font-weight: var(--subheading-weight);
        color: var(--text-color);
        line-height: var(--heading-line-height);
        margin-bottom: 0.5em;
      `,
      h5: `
        font-family: var(--heading-font-family);
        font-size: var(--body-font-size);
        font-weight: var(--subheading-weight);
        color: var(--text-color);
        line-height: var(--heading-line-height);
        margin-bottom: 0.5em;
      `,
      h6: `
        font-family: var(--heading-font-family);
        font-size: var(--small-font-size);
        font-weight: var(--subheading-weight);
        color: var(--text-secondary);
        line-height: var(--heading-line-height);
        margin-bottom: 0.5em;
      `,
      p: `
        font-size: var(--body-font-size);
        font-weight: var(--body-weight);
        line-height: var(--body-line-height);
        color: var(--on-background-color);
        margin-bottom: var(--paragraph-spacing);
      `,
      strong: `
        font-weight: var(--bold-weight);
        color: var(--emphasis-color);
      `,
      em: `
        font-style: italic;
        color: var(--emphasis-color);
      `,
      a: `
        color: var(--link-color);
        text-decoration: underline;
      `,
      code: `
        font-size: var(--inline-code-font-size);
        font-family: monospace;
        background-color: var(--muted-color);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
      `,
      pre: `
        background-color: var(--muted-color);
        padding: 1rem;
        border-radius: 0.25rem;
        overflow-x: auto;
        margin-bottom: var(--paragraph-spacing);
      `,
      ul: `
        margin-left: var(--bullet-level1-indent);
        margin-bottom: var(--paragraph-spacing);
        list-style-type: disc;
        color: var(--bullet-level1-color);
      `,
      ol: `
        margin-left: var(--bullet-level1-indent);
        margin-bottom: var(--paragraph-spacing);
        list-style-type: decimal;
      `,
      li: `
        line-height: var(--body-line-height);
        margin-bottom: calc(var(--paragraph-spacing) / 2);
        font-size: var(--body-font-size);
      `,
      blockquote: `
        border-left: 4px solid var(--primary-color);
        padding-left: 1rem;
        margin-left: 0;
        margin-bottom: var(--paragraph-spacing);
        font-style: italic;
        color: var(--text-secondary);
      `,
      table: `
        width: 100%;
        border-collapse: collapse;
        margin-bottom: var(--paragraph-spacing);
        font-size: var(--body-font-size);
      `,
      th: `
        background-color: var(--surface-color);
        padding: 0.5rem;
        text-align: left;
        font-weight: var(--bold-weight);
        border-bottom: 2px solid var(--border-color);
      `,
      td: `
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-color);
      `,
      hr: `
        border: none;
        border-top: 1px solid var(--border-color);
        margin: var(--section-spacing) 0;
      `
    };

    if (styleMap[node.tagName]) {
      // Merge existing style with new style
      const newStyle = styleMap[node.tagName].trim().replace(/\s+/g, ' ');
      node.properties = {
        ...node.properties,
        style: existingStyle ? `${existingStyle}; ${newStyle}` : newStyle
      };
    }

    // Handle nested lists (levels 2-3)
    if ((node.tagName === 'ul' || node.tagName === 'ol')) {
      // Check if this is a nested list by looking at parent
      const depth = this.getListDepth(node);
      if (depth === 2) {
        node.properties.style += '; margin-left: var(--bullet-level2-indent); color: var(--bullet-level2-color);';
      } else if (depth >= 3) {
        node.properties.style += '; margin-left: var(--bullet-level3-indent); color: var(--bullet-level3-color);';
      }
    }
  }

  /**
   * Helper to determine list nesting depth
   */
  private getListDepth(node: any): number {
    let depth = 1;
    let parent = node.parent;
    while (parent) {
      if (parent.tagName === 'ul' || parent.tagName === 'ol' || parent.tagName === 'li') {
        depth++;
      }
      parent = parent.parent;
    }
    return Math.min(depth, 3); // Cap at level 3
  }

  /**
   * Validate and structure frontmatter data
   */
  private validateFrontmatter(data: any): CVFrontmatter {
    const { strictFrontmatter = true, validateRequired = true } = this.options;

    // If no frontmatter provided, return empty object (will be populated from content)
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return {} as CVFrontmatter;
    }

    // Required fields validation (only if frontmatter exists)
    const required = ['name', 'email'];
    if (validateRequired) {
      for (const field of required) {
        if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
          throw new CVParserError(`Frontmatter field '${field}' is required and must be a non-empty string`);
        }
      }
    }

    // Email validation
    if (data.email && !this.isValidEmail(data.email)) {
      throw new CVParserError(`Invalid email format: ${data.email}`);
    }

    // Phone validation (if provided)
    if (data.phone && !this.isValidPhone(String(data.phone))) {
      throw new CVParserError(`Invalid phone format: ${data.phone}`);
    }

    // URL validation (if provided)
    const urlFields = ['website', 'linkedin', 'github'];
    for (const field of urlFields) {
      if (data[field] && !this.isValidUrl(data[field])) {
        throw new CVParserError(`Invalid URL format for ${field}: ${data[field]}`);
      }
    }

    return {
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      phone: data.phone ? String(data.phone).trim() : undefined,
      location: data.location?.trim(),
      website: data.website?.trim(),
      linkedin: data.linkedin?.trim(),
      github: data.github?.trim(),
      ...data // Include any additional fields
    };
  }

  /**
   * Extract contact information from markdown content when no frontmatter exists
   */
  private extractContactFromContent(tree: any, frontmatter: CVFrontmatter): CVFrontmatter {
    let name = '';
    let email = '';
    let phone = '';
    let location = '';
    let website = '';
    let linkedin = '';
    let github = '';

    this.walkTree(tree, (node: any) => {
      if (node.type === 'heading' && node.depth === 1 && !name) {
        // Extract name from first H1 heading
        name = this.extractTextFromNode(node).trim();
      }
      
      if (node.type === 'paragraph') {
        const text = this.extractTextFromNode(node);
        
        // Extract email - look for email patterns
        const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
        if (emailMatch && !email) {
          email = emailMatch[0];
        }
        
        // Extract phone - look for phone patterns after emoji or **📱**
        const phoneMatch = text.match(/(?:📱|phone|tel|mobile)[\s\*]*:?\s*([\+\d\s\-\(\)\.]+)/i);
        if (phoneMatch && !phone) {
          phone = phoneMatch[1].trim();
        }
        
        // Extract location - look for location patterns after emoji or **📍**
        const locationMatch = text.match(/(?:📍|location|address)[\s\*]*:?\s*([^,\n]+)/i);
        if (locationMatch && !location) {
          location = locationMatch[1].trim();
        }
        
        // Extract LinkedIn URL
        const linkedinMatch = text.match(/(?:linkedin\.com\/in\/[\w\-]+|🔗.*linkedin[^\s]*)/i);
        if (linkedinMatch && !linkedin) {
          const urlMatch = linkedinMatch[0].match(/(https?:\/\/[^\s\)]+|linkedin\.com\/in\/[\w\-]+)/);
          if (urlMatch) {
            linkedin = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
          }
        }
        
        // Extract GitHub URL
        const githubMatch = text.match(/(?:github\.com\/[\w\-]+|💻.*github[^\s]*)/i);
        if (githubMatch && !github) {
          const urlMatch = githubMatch[0].match(/(https?:\/\/[^\s\)]+|github\.com\/[\w\-]+)/);
          if (urlMatch) {
            github = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
          }
        }
        
        // Extract website URL (general links that aren't LinkedIn/GitHub)
        const websiteMatch = text.match(/(https?:\/\/[^\s\)]+)/);
        if (websiteMatch && !website && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
          website = websiteMatch[0];
        }
      }
    });

    const result: CVFrontmatter = {
      ...frontmatter
    };

    if (name) result.name = name;
    if (email) result.email = email;
    if (phone) result.phone = phone;
    if (location) result.location = location;
    if (website) result.website = website;
    if (linkedin) result.linkedin = linkedin;
    if (github) result.github = github;

    return result;
  }

  /**
   * Extract structured sections from Markdown AST with rich entry parsing
   */
  private extractSections(tree: any): CVSection[] {
    const sections: CVSection[] = [];
    let currentSection: any = null;
    let currentEntry: any = null;

    // Walk through AST nodes
    this.walkTree(tree, (node: any) => {
      switch (node.type) {
        case 'html': {
          // Detect <!-- break --> marker (case-insensitive, flexible whitespace)
          const trimmed = node.value.trim();
          if (/^<!--\s*break\s*-->$/i.test(trimmed)) {
            // Finalize and push current section (if any)
            if (currentSection) {
              if (currentEntry && currentSection.type in { experience: 1, education: 1, projects: 1 }) {
                if (!Array.isArray(currentSection.content)) {
                  currentSection.content = [];
                }
                if (Array.isArray(currentEntry.description)) {
                  currentEntry.description = currentEntry.description.join('\n\n');
                }
                currentSection.content.push(currentEntry);
              }
              sections.push(currentSection);
              currentSection = null;
              currentEntry = null;
            }
            // Push a synthetic break-marker section at this position
            sections.push({
              type: 'paragraph',
              title: '',
              content: '',
              breakBefore: true
            });
          }
          break;
        }

        case 'heading':
          if (node.depth === 2) {
            // H2 - Start new section
            if (currentSection) {
              // Finalize previous entry if exists
              if (currentEntry && currentSection.type in { experience: 1, education: 1, projects: 1 }) {
                if (!Array.isArray(currentSection.content)) {
                  currentSection.content = [];
                }
                currentSection.content.push(currentEntry);
              }
              sections.push(currentSection);
              currentEntry = null;
            }

            const title = this.extractTextFromNode(node);
            currentSection = {
              type: this.inferSectionTypeFromTitle(title),
              title: title,
              level: node.depth,
              content: []
            };
          } else if (node.depth === 3 && currentSection) {
            // H3 - Start new entry within section (job, education, project)
            if (currentEntry && currentSection.type in { experience: 1, education: 1, projects: 1 }) {
              if (!Array.isArray(currentSection.content)) {
                currentSection.content = [];
              }
              // Convert description array to string before pushing
              if (Array.isArray(currentEntry.description)) {
                currentEntry.description = currentEntry.description.join('\n\n');
              }
              currentSection.content.push(currentEntry);
            }

            const titleText = this.extractTextFromNode(node);
            currentEntry = this.parseEntryTitle(titleText);
          }
          break;

        case 'paragraph':
          if (currentSection) {
            const text = this.extractTextFromNode(node);
            if (text.trim()) {
              if (currentEntry) {
                // We're inside a structured entry

                // 1) "**Company** | Date" or "**Company** · Date" pattern
                //    e.g. "**ArrivalGuides AB** | August 2018 – April 2023"
                const companyDateMatch = text.match(
                  /^\*\*(.+?)\*\*\s*(?:\||·|•|—)\s*(.+)$/
                );
                if (companyDateMatch && companyDateMatch[2].match(/\d{4}/)) {
                  if (!currentEntry.company) {
                    currentEntry.company = companyDateMatch[1].trim();
                  }
                  if (!currentEntry.date) {
                    currentEntry.date = companyDateMatch[2].trim();
                  }
                }
                // 2) Standalone bold company: "**Company Name**"
                else if (text.match(/^\*\*[^*]+\*\*$/) && !currentEntry.company) {
                  currentEntry.company = text.replace(/^\*\*|\*\*$/g, '').trim();
                }
                // 3) Plain "Company | Date" (no bold)
                else if (text.includes('|') && !currentEntry.company) {
                  const pipeIdx = text.indexOf('|');
                  const before = text.substring(0, pipeIdx).trim();
                  const after = text.substring(pipeIdx + 1).trim();
                  if (before && after.match(/\d{4}/)) {
                    currentEntry.company = before;
                    if (!currentEntry.date) {
                      currentEntry.date = after;
                    }
                  } else {
                    // Not a company|date line, treat as description
                    if (!currentEntry.description) {
                      currentEntry.description = [];
                    }
                    currentEntry.description.push(text);
                  }
                }
                // 4) Date-only line (often in bold or italic)
                else {
                  const dateMatch = text.match(/^[\*_]*(.*?[\d]{4}.*?)[\*_]*$/);
                  if (dateMatch && !currentEntry.date) {
                    currentEntry.date = dateMatch[1].trim();
                  } else {
                    // Description text
                    if (!currentEntry.description) {
                      currentEntry.description = [];
                    }
                    currentEntry.description.push(text);
                  }
                }
              } else {
                // Plain paragraph in section
                if (!Array.isArray(currentSection.content)) {
                  currentSection.content = [];
                }
                currentSection.content.push(text);
              }
            }
          }
          break;

        case 'list':
          if (currentSection) {
            const listItems = this.extractListItems(node);

            if (currentSection.type === 'skills') {
              // Parse skills with categories
              currentSection.content = this.parseSkillsList(listItems);
            } else if (currentEntry) {
              // Bullet points belong to current entry
              if (!currentEntry.bullets) {
                currentEntry.bullets = [];
              }
              currentEntry.bullets.push(...listItems);
            } else {
              // Standalone list in section
              if (!Array.isArray(currentSection.content)) {
                currentSection.content = [];
              }
              currentSection.content.push(...listItems);
            }
          }
          // Skip walking into list children - already processed via extractListItems
          return false;
      }
    });

    // Finalize last entry and section
    if (currentEntry && currentSection && currentSection.type in { experience: 1, education: 1, projects: 1 }) {
      if (!Array.isArray(currentSection.content)) {
        currentSection.content = [];
      }
      // Convert description array to string before pushing
      if (Array.isArray(currentEntry.description)) {
        currentEntry.description = currentEntry.description.join('\n\n');
      }
      currentSection.content.push(currentEntry);
    }
    if (currentSection) {
      sections.push(currentSection);
    }

    // FINAL PASS: Ensure ALL entry descriptions are strings (safety net)
    sections.forEach(section => {
      if (section.type in { experience: 1, education: 1, projects: 1 } && Array.isArray(section.content)) {
        section.content = section.content.map((entry: any) => {
          if (entry && typeof entry === 'object' && Array.isArray(entry.description)) {
            return {
              ...entry,
              description: entry.description.join('\n\n')
            };
          }
          return entry;
        });
      }
    });

    return sections.filter(section =>
      // Preserve break-marker sections (synthetic <!-- break --> markers)
      section.breakBefore ||
      section.content && (
        typeof section.content === 'string' ? section.content.trim() :
        Array.isArray(section.content) ? section.content.length > 0 : true
      )
    );
  }

  /**
   * Parse entry title to extract job title, company, etc.
   */
  private parseEntryTitle(titleText: string): any {
    const entry: any = {
      title: titleText,
      company: '',
      date: '',
      location: '',
      description: [],
      bullets: []
    };

    // Try various formats:
    // "Job Title | Company Name"
    if (titleText.includes('|')) {
      const parts = titleText.split('|').map(p => p.trim());
      entry.title = parts[0];
      entry.company = parts[1] || '';
    }
    // "Job Title at Company Name"
    else if (titleText.match(/\s+at\s+/i)) {
      const match = titleText.match(/^(.+?)\s+at\s+(.+)$/i);
      if (match) {
        entry.title = match[1].trim();
        entry.company = match[2].trim();
      }
    }

    return entry;
  }

  /**
   * Parse skills list with categories
   */
  private parseSkillsList(items: any[]): any[] {
    const skills: any[] = [];

    for (const item of items) {
      // Extract text from CVListItem if needed
      const text = typeof item === 'string' ? item : (item.text || String(item));

      // Check if it's a category line (contains colon)
      const categoryMatch = text.match(/^\*\*([^:]+):\*\*\s*(.+)$/);
      if (categoryMatch) {
        skills.push({
          category: categoryMatch[1].trim(),
          skills: categoryMatch[2].split(',').map((s: string) => s.trim())
        });
      } else {
        // Plain skill item
        skills.push(text);
      }
    }

    return skills.length > 0 ? skills : items;
  }

  /**
   * Infer section type from title
   */
  private inferSectionTypeFromTitle(title: string): CVSection['type'] {
    const lower = title.toLowerCase();

    if (lower.includes('experience') || lower.includes('work') || lower.includes('employment')) {
      return 'experience';
    }
    if (lower.includes('education') || lower.includes('academic')) {
      return 'education';
    }
    if (lower.includes('skill') || lower.includes('technolog') || lower.includes('competenc')) {
      return 'skills';
    }
    if (lower.includes('project')) {
      return 'projects';
    }
    if (lower.includes('language')) {
      return 'languages';
    }
    if (lower.includes('certification') || lower.includes('award')) {
      return 'certifications';
    }
    if (lower.includes('interest') || lower.includes('hobbi')) {
      return 'interests';
    }
    if (lower.includes('reference')) {
      return 'references';
    }
    if (lower.includes('summary') || lower.includes('profile') || lower.includes('about')) {
      return 'summary';
    }

    return 'paragraph';
  }


  /**
   * Extract text content from AST node, preserving inline markdown formatting.
   * Reconstructs **bold**, *italic*, `code`, and [link](url) syntax from AST nodes
   * so that downstream renderers (renderInlineMarkdown) can convert them to HTML.
   */
  private extractTextFromNode(node: any): string {
    if (node.type === 'text') {
      return node.value;
    }

    // Preserve line breaks (markdown soft line break: two trailing spaces)
    if (node.type === 'break') {
      return '\n';
    }

    // Inline code: preserve backtick syntax
    if (node.type === 'inlineCode') {
      return '`' + node.value + '`';
    }

    // Get child text first
    const childText = node.children
      ? node.children.map((child: any) => this.extractTextFromNode(child)).join('')
      : '';

    // Reconstruct markdown syntax from AST node types
    if (node.type === 'strong') {
      return '**' + childText + '**';
    }

    if (node.type === 'emphasis') {
      return '*' + childText + '*';
    }

    if (node.type === 'link') {
      return '[' + childText + '](' + (node.url || '') + ')';
    }

    return childText;
  }

  /**
   * Extract list items recursively
   */
  private extractListItems(listNode: any): CVListItem[] {
    if (!listNode.children) return [];
    
    return listNode.children.map((item: any) => {
      const text = this.extractTextFromNode(item);
      const nestedLists = item.children?.filter((child: any) => child.type === 'list') || [];
      
      const result: CVListItem = { text: text.trim() };
      
      if (nestedLists.length > 0) {
        result.items = nestedLists.flatMap((list: any) => this.extractListItems(list));
      }
      
      return result;
    });
  }

  /**
   * Flatten skills from nested list structure
   */
  private flattenSkills(listItems: CVListItem[]): string[] {
    const skills: string[] = [];
    
    const flatten = (items: CVListItem[]) => {
      for (const item of items) {
        if (item.text && item.text.trim()) {
          // Split comma-separated skills
          const itemSkills = item.text.split(',').map((skill: string) => skill.trim()).filter(Boolean);
          skills.push(...itemSkills);
        }
        if (item.items) {
          flatten(item.items);
        }
      }
    };
    
    flatten(listItems);
    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Walk AST tree recursively
   * Callback can return false to skip walking children of current node
   */
  private walkTree(node: any, callback: (node: any) => boolean | void) {
    const result = callback(node);
    if (result === false) return; // Skip children
    if (node.children) {
      for (const child of node.children) {
        this.walkTree(child, callback);
      }
    }
  }

  /**
   * Validate email format (RFC 5322 compliant)
   */
  private isValidEmail(email: string): boolean {
    // More comprehensive email validation based on RFC 5322
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Additional checks
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check for valid TLD (at least 2 characters)
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }

    const domain = parts[1];
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return false;
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return false;
    }

    return true;
  }

  /**
   * Validate phone format (flexible - international formats)
   */
  private isValidPhone(phone: string): boolean {
    // Remove common separators and spaces
    const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, '');
    // Should be 10-15 digits (international standards)
    return /^\d{10,15}$/.test(cleaned);
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Custom error class for CV parsing errors
 */
export class CVParserError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'CVParserError';
  }
}

/**
 * Convenience function for parsing CV content
 */
export async function parseCV(
  content: string,
  options?: CVParserOptions,
  config?: TemplateConfig
): Promise<ParsedCVContent> {
  const parser = new CVParser(options);
  return parser.parse(content, config);
}

/**
 * Validate CV content without full parsing
 */
export function validateCVContent(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const { data, content: markdownContent } = matter(content);
    
    // Check if frontmatter exists and has required fields
    if (data && Object.keys(data).length > 0) {
      // Frontmatter validation path
      if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        errors.push('Frontmatter must include a valid "name" field');
      }
      
      if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
        errors.push('Frontmatter must include a valid "email" field');
      }
      
      // Validate email format
      if (data.email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const emailParts = data.email.split('@');
        const hasValidTLD = emailParts.length === 2 && emailParts[1].split('.').length >= 2;

        if (!emailRegex.test(data.email) || !hasValidTLD) {
          errors.push('Email format is invalid');
        }
      }
    } else {
      // Plain markdown validation path - check if we can extract name and email from content
      const hasH1Heading = /^#\s+.+/m.test(markdownContent);
      const hasEmail = /[\w\.-]+@[\w\.-]+\.\w+/.test(markdownContent);
      
      if (!hasH1Heading) {
        errors.push('CV must have a name as the first H1 heading (# Name) or in frontmatter');
      }
      
      if (!hasEmail) {
        errors.push('CV must include a valid email address in the content or frontmatter');
      }
    }
    
    return { valid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`Invalid YAML frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors };
  }
}