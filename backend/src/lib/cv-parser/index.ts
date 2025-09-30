/**
 * CV Parser Library
 * 
 * Parses structured Markdown files into CV data using Remark ecosystem.
 * Extracts frontmatter and converts content sections into structured format.
 */

import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import matter from 'gray-matter';
import type { 
  ParsedCVContent, 
  CVFrontmatter, 
  CVSection, 
  CVExperienceItem,
  CVEducationItem,
  CVListItem 
} from '../../../../shared/types';

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
   */
  async parse(content: string): Promise<ParsedCVContent> {
    try {
      // Extract frontmatter using gray-matter
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      // Validate frontmatter
      let validatedFrontmatter = this.validateFrontmatter(frontmatter);
      
      // Parse markdown content into AST
      const tree = this.processor.parse(markdownContent);
      
      // Extract sections from AST
      const sections = this.extractSections(tree);
      
      // If no frontmatter provided, try to extract contact info from content
      if (Object.keys(validatedFrontmatter).length === 0) {
        validatedFrontmatter = this.extractContactFromContent(tree, validatedFrontmatter);
      }
      
      return {
        frontmatter: validatedFrontmatter,
        sections
      };
    } catch (error) {
      throw new CVParserError(`Failed to parse CV content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
   * Extract structured sections from Markdown AST
   */
  private extractSections(tree: any): CVSection[] {
    const sections: CVSection[] = [];
    let currentSection: Partial<CVSection> | null = null;
    
    // Walk through AST nodes
    this.walkTree(tree, (node: any) => {
      switch (node.type) {
        case 'heading':
          // Start new section
          if (currentSection) {
            sections.push(currentSection as CVSection);
          }
          
          currentSection = {
            type: this.inferSectionType(node),
            title: this.extractTextFromNode(node),
            level: node.depth,
            content: []
          };
          break;
          
        case 'paragraph':
          if (currentSection) {
            const text = this.extractTextFromNode(node);
            if (text.trim()) {
              if (typeof currentSection.content === 'string') {
                currentSection.content += '\n' + text;
              } else if (Array.isArray(currentSection.content)) {
                // Always convert to string array and append
                const stringArray = currentSection.content.map(item => String(item));
                stringArray.push(text);
                currentSection.content = stringArray;
              } else {
                currentSection.content = text;
              }
            }
          }
          break;
          
        case 'list':
          if (currentSection) {
            const listItems = this.extractListItems(node);
            if (currentSection.type === 'skills') {
              // Skills section - extract skills as flat array
              currentSection.content = this.flattenSkills(listItems);
            } else {
              currentSection.content = listItems;
            }
          }
          break;
      }
    });
    
    // Add final section
    if (currentSection) {
      sections.push(currentSection as CVSection);
    }
    
    return sections.filter(section => section.content && 
      (typeof section.content === 'string' ? section.content.trim() : 
       Array.isArray(section.content) ? section.content.length > 0 : true)
    );
  }

  /**
   * Infer section type from heading content
   */
  private inferSectionType(headingNode: any): CVSection['type'] {
    const title = this.extractTextFromNode(headingNode).toLowerCase();
    
    if (title.includes('experience') || title.includes('work') || title.includes('employment')) {
      return 'experience';
    }
    if (title.includes('education') || title.includes('academic')) {
      return 'education';
    }
    if (title.includes('skill') || title.includes('technolog') || title.includes('competenc')) {
      return 'skills';
    }
    if (title.includes('project')) {
      return 'projects';
    }
    
    return 'paragraph'; // Default type
  }

  /**
   * Extract text content from AST node
   */
  private extractTextFromNode(node: any): string {
    if (node.type === 'text') {
      return node.value;
    }
    
    if (node.children) {
      return node.children.map((child: any) => this.extractTextFromNode(child)).join('');
    }
    
    return '';
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
   */
  private walkTree(node: any, callback: (node: any) => void) {
    callback(node);
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
export async function parseCV(content: string, options?: CVParserOptions): Promise<ParsedCVContent> {
  const parser = new CVParser(options);
  return parser.parse(content);
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