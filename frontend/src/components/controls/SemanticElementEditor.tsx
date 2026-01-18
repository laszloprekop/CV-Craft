import React, { useState } from 'react';
import {
  TextT,
  TextHTwo,
  TextHThree,
  Paragraph,
  TextAa,
  Tag,
  Calendar,
  Link,
  ListBullets,
  User,
  AddressBook,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextItalic,
  TextUnderline,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import type { TemplateConfig } from '../../../../shared/types';
import { SpacingControl, NumberControl, SelectControl, SemanticColorControl, FontSelector } from './index';

// Define semantic elements that can be styled
type SemanticElement =
  | 'base'
  | 'name'
  | 'sectionHeader'
  | 'date'
  | 'tag'
  | 'link'
  | 'contact';

interface ElementDef {
  id: SemanticElement;
  label: string;
  description: string;
}

// Element definitions
const ELEMENTS: ElementDef[] = [
  { id: 'base', label: 'Base', description: 'Default typography' },
  { id: 'name', label: 'Name', description: 'Your name (H1)' },
  { id: 'sectionHeader', label: 'Section', description: 'Section headers (H2)' },
  { id: 'date', label: 'Date', description: 'Date ranges' },
  { id: 'tag', label: 'Tag', description: 'Skill tags' },
  { id: 'link', label: 'Link', description: 'Hyperlinks' },
  { id: 'contact', label: 'Contact', description: 'Contact info' },
];

// Icons for elements
const ELEMENT_ICONS: Record<SemanticElement, React.ReactNode> = {
  base: <TextT size={12} />,
  name: <User size={12} />,
  sectionHeader: <TextHTwo size={12} />,
  date: <Calendar size={12} />,
  tag: <Tag size={12} />,
  link: <Link size={12} />,
  contact: <AddressBook size={12} />,
};

interface SemanticElementEditorProps {
  config: TemplateConfig;
  onChange: (section: keyof TemplateConfig, value: any) => void;
  onCommit: (section: keyof TemplateConfig, value: any) => void;
}

// Collapsible section
const Section: React.FC<{
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ label, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/50 rounded mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 py-1.5 px-2 text-[10px] font-semibold text-text-primary hover:bg-surface/50 rounded-t transition-colors"
      >
        <span className="flex-1 text-left uppercase tracking-wide">{label}</span>
        {isOpen ? <CaretUp size={10} /> : <CaretDown size={10} />}
      </button>
      {isOpen && <div className="px-2 pb-2">{children}</div>}
    </div>
  );
};

// Main component
export const SemanticElementEditor: React.FC<SemanticElementEditorProps> = ({
  config,
  onChange,
}) => {
  const [activeElement, setActiveElement] = useState<SemanticElement>('base');

  const activeElementDef = ELEMENTS.find(e => e.id === activeElement)!;

  // Render editor for base typography
  const renderBaseEditor = () => (
    <>
      <Section label="Typography">
        <FontSelector
          label="Body Font"
          value={config.typography.fontFamily.body}
          onChange={(v) => onChange('typography', { fontFamily: { ...config.typography.fontFamily, body: v } })}
          fontType="body"
        />
        <FontSelector
          label="Heading Font"
          value={config.typography.fontFamily.heading}
          onChange={(v) => onChange('typography', { fontFamily: { ...config.typography.fontFamily, heading: v } })}
          fontType="heading"
        />
        <SpacingControl
          label="Base Size"
          value={config.typography.baseFontSize}
          onChange={(v) => onChange('typography', { baseFontSize: v })}
          units={['pt', 'px']}
        />
        <div className="grid grid-cols-2 gap-1">
          <NumberControl
            label="Body Weight"
            value={config.typography.fontWeight.body}
            onChange={(v) => onChange('typography', { fontWeight: { ...config.typography.fontWeight, body: v } })}
            min={100}
            max={900}
            step={100}
          />
          <NumberControl
            label="Heading Weight"
            value={config.typography.fontWeight.heading}
            onChange={(v) => onChange('typography', { fontWeight: { ...config.typography.fontWeight, heading: v } })}
            min={100}
            max={900}
            step={100}
          />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <NumberControl
            label="Body Line H."
            value={config.typography.lineHeight.body}
            onChange={(v) => onChange('typography', { lineHeight: { ...config.typography.lineHeight, body: v } })}
            min={1}
            max={3}
            step={0.1}
          />
          <NumberControl
            label="Heading Line H."
            value={config.typography.lineHeight.heading}
            onChange={(v) => onChange('typography', { lineHeight: { ...config.typography.lineHeight, heading: v } })}
            min={1}
            max={3}
            step={0.1}
          />
        </div>
      </Section>
    </>
  );

  // Render editor for name (H1)
  const renderNameEditor = () => {
    const comp = config.components.name || {};
    const update = (key: string, value: any) => {
      onChange('components', { name: { ...config.components.name, [key]: value } });
    };
    return (
      <>
        <Section label="Typography">
          <SpacingControl
            label="Font Size"
            value={comp.fontSize || '32px'}
            onChange={(v) => update('fontSize', v)}
            units={['px', 'pt', 'rem']}
          />
          <NumberControl
            label="Font Weight"
            value={comp.fontWeight || 700}
            onChange={(v) => update('fontWeight', v)}
            min={100}
            max={900}
            step={100}
          />
          <SemanticColorControl
            label="Color"
            colorKey={comp.colorKey || 'text-primary'}
            opacity={comp.colorOpacity ?? 1}
            onColorChange={(v) => update('colorKey', v)}
            onOpacityChange={(v) => update('colorOpacity', v)}
            showOpacity={true}
          />
          <SpacingControl
            label="Letter Spacing"
            value={comp.letterSpacing || '0px'}
            onChange={(v) => update('letterSpacing', v)}
            units={['px', 'em']}
          />
          <SelectControl
            label="Text Transform"
            value={comp.textTransform || 'none'}
            onChange={(v) => update('textTransform', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'uppercase', label: 'UPPERCASE' },
              { value: 'capitalize', label: 'Capitalize' },
              { value: 'lowercase', label: 'lowercase' },
            ]}
          />
        </Section>
        <Section label="Spacing" defaultOpen={false}>
          <SpacingControl
            label="Margin Bottom"
            value={comp.marginBottom || '8px'}
            onChange={(v) => update('marginBottom', v)}
          />
        </Section>
      </>
    );
  };

  // Render editor for section headers (H2)
  const renderSectionHeaderEditor = () => {
    const comp = config.components.sectionHeader || {};
    const update = (key: string, value: any) => {
      onChange('components', { sectionHeader: { ...config.components.sectionHeader, [key]: value } });
    };
    return (
      <>
        <Section label="Typography">
          <SpacingControl
            label="Font Size"
            value={comp.fontSize || '20px'}
            onChange={(v) => update('fontSize', v)}
            units={['px', 'pt', 'rem']}
          />
          <NumberControl
            label="Font Weight"
            value={comp.fontWeight || 700}
            onChange={(v) => update('fontWeight', v)}
            min={100}
            max={900}
            step={100}
          />
          <SemanticColorControl
            label="Color"
            colorKey={comp.colorKey || 'primary'}
            opacity={comp.colorOpacity ?? 1}
            onColorChange={(v) => update('colorKey', v)}
            onOpacityChange={(v) => update('colorOpacity', v)}
            showOpacity={true}
          />
          <SpacingControl
            label="Letter Spacing"
            value={comp.letterSpacing || '0px'}
            onChange={(v) => update('letterSpacing', v)}
            units={['px', 'em']}
          />
          <SelectControl
            label="Text Transform"
            value={comp.textTransform || 'uppercase'}
            onChange={(v) => update('textTransform', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'uppercase', label: 'UPPERCASE' },
              { value: 'capitalize', label: 'Capitalize' },
            ]}
          />
        </Section>
        <Section label="Spacing" defaultOpen={false}>
          <SpacingControl
            label="Margin Top"
            value={comp.marginTop || '16px'}
            onChange={(v) => update('marginTop', v)}
          />
          <SpacingControl
            label="Margin Bottom"
            value={comp.marginBottom || '8px'}
            onChange={(v) => update('marginBottom', v)}
          />
          <SpacingControl
            label="Padding"
            value={comp.padding || '4px 12px'}
            onChange={(v) => update('padding', v)}
          />
        </Section>
        <Section label="Border" defaultOpen={false}>
          <SelectControl
            label="Divider Style"
            value={comp.dividerStyle || 'none'}
            onChange={(v) => update('dividerStyle', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'underline', label: 'Underline' },
              { value: 'full-width', label: 'Full Width' },
            ]}
          />
          {comp.dividerStyle && comp.dividerStyle !== 'none' && (
            <>
              <SpacingControl
                label="Divider Width"
                value={comp.dividerWidth || '2px'}
                onChange={(v) => update('dividerWidth', v)}
                units={['px', 'pt']}
              />
              <SemanticColorControl
                label="Divider Color"
                colorKey={comp.dividerColorKey || 'primary'}
                opacity={comp.dividerColorOpacity ?? 1}
                onColorChange={(v) => update('dividerColorKey', v)}
                onOpacityChange={(v) => update('dividerColorOpacity', v)}
                showOpacity={true}
              />
            </>
          )}
        </Section>
      </>
    );
  };

  // Render editor for dates
  const renderDateEditor = () => {
    const comp = config.components.dateLine || {};
    const update = (key: string, value: any) => {
      onChange('components', { dateLine: { ...config.components.dateLine, [key]: value } });
    };
    return (
      <>
        <Section label="Typography">
          <SemanticColorControl
            label="Color"
            colorKey={comp.colorKey || 'text-secondary'}
            opacity={comp.colorOpacity ?? 1}
            onColorChange={(v) => update('colorKey', v)}
            onOpacityChange={(v) => update('colorOpacity', v)}
            showOpacity={true}
          />
          <SelectControl
            label="Font Style"
            value={comp.fontStyle || 'normal'}
            onChange={(v) => update('fontStyle', v)}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'italic', label: 'Italic' },
            ]}
          />
          <SelectControl
            label="Alignment"
            value={comp.alignment || 'left'}
            onChange={(v) => update('alignment', v)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </Section>
      </>
    );
  };

  // Render editor for tags
  const renderTagEditor = () => {
    const comp = config.components.tags || {};
    const update = (key: string, value: any) => {
      onChange('components', { tags: { ...config.components.tags, [key]: value } });
    };
    return (
      <>
        <Section label="Appearance">
          <SelectControl
            label="Style"
            value={comp.style || 'pill'}
            onChange={(v) => update('style', v)}
            options={[
              { value: 'pill', label: 'Pill (rounded)' },
              { value: 'inline', label: 'Inline (text)' },
            ]}
          />
          <SemanticColorControl
            label="Background"
            colorKey={comp.colorPair || 'tertiary'}
            opacity={comp.backgroundOpacity ?? 0.2}
            onColorChange={(v) => update('colorPair', v)}
            onOpacityChange={(v) => update('backgroundOpacity', v)}
            showOpacity={true}
          />
          <SpacingControl
            label="Border Radius"
            value={comp.borderRadius || '4px'}
            onChange={(v) => update('borderRadius', v)}
            units={['px', 'rem', '%']}
          />
        </Section>
      </>
    );
  };

  // Render editor for links
  const renderLinkEditor = () => {
    const comp = config.components.links || {};
    const update = (key: string, value: any) => {
      onChange('components', { links: { ...config.components.links, [key]: value } });
    };
    return (
      <>
        <Section label="Typography">
          <SemanticColorControl
            label="Link Color"
            colorKey={comp.colorKey || 'primary'}
            opacity={comp.colorOpacity ?? 1}
            onColorChange={(v) => update('colorKey', v)}
            onOpacityChange={(v) => update('colorOpacity', v)}
            showOpacity={true}
          />
          <SemanticColorControl
            label="Hover Color"
            colorKey={comp.hoverColorKey || 'secondary'}
            opacity={comp.hoverColorOpacity ?? 1}
            onColorChange={(v) => update('hoverColorKey', v)}
            onOpacityChange={(v) => update('hoverColorOpacity', v)}
            showOpacity={true}
          />
          <SelectControl
            label="Underline"
            value={comp.underlineStyle || 'none'}
            onChange={(v) => update('underlineStyle', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'always', label: 'Always' },
              { value: 'hover', label: 'On Hover' },
            ]}
          />
        </Section>
      </>
    );
  };

  // Render editor for contact
  const renderContactEditor = () => {
    const comp = config.components.contactInfo || {};
    const update = (key: string, value: any) => {
      onChange('components', { contactInfo: { ...config.components.contactInfo, [key]: value } });
    };
    return (
      <>
        <Section label="Layout">
          <SelectControl
            label="Arrangement"
            value={comp.layout || 'stacked'}
            onChange={(v) => update('layout', v)}
            options={[
              { value: 'stacked', label: 'Stacked (vertical)' },
              { value: 'inline', label: 'Inline (wrapped)' },
              { value: 'grid', label: 'Grid (columns)' },
            ]}
          />
          <SpacingControl
            label="Spacing"
            value={comp.spacing || '8px'}
            onChange={(v) => update('spacing', v)}
          />
          <SpacingControl
            label="Icon Size"
            value={comp.iconSize || '16px'}
            onChange={(v) => update('iconSize', v)}
            units={['px', 'rem']}
          />
        </Section>
      </>
    );
  };

  // Render the appropriate editor based on active element
  const renderEditor = () => {
    switch (activeElement) {
      case 'base':
        return renderBaseEditor();
      case 'name':
        return renderNameEditor();
      case 'sectionHeader':
        return renderSectionHeaderEditor();
      case 'date':
        return renderDateEditor();
      case 'tag':
        return renderTagEditor();
      case 'link':
        return renderLinkEditor();
      case 'contact':
        return renderContactEditor();
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Element selector - horizontal tag cloud */}
      <div className="flex flex-wrap gap-1 p-1.5 border-b border-border bg-surface/30">
        {ELEMENTS.map((element) => {
          const isActive = activeElement === element.id;
          return (
            <button
              key={element.id}
              onClick={() => setActiveElement(element.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-surface hover:bg-surface/80 text-text-secondary hover:text-text-primary'
              }`}
              title={element.description}
            >
              {ELEMENT_ICONS[element.id]}
              <span>{element.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active element description */}
      <div className="px-2 py-1.5 text-[10px] text-text-secondary border-b border-border/50 bg-surface/20">
        <span className="font-semibold text-text-primary">{activeElementDef.label}</span>
        <span className="mx-1">—</span>
        <span>{activeElementDef.description}</span>
      </div>

      {/* Property editors */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {renderEditor()}
      </div>
    </div>
  );
};

export default SemanticElementEditor;
