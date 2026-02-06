import React, { useState } from 'react';
import {
  IconTypography,
  IconH1,
  IconH2,
  IconH3,
  IconTag,
  IconCalendar,
  IconLink,
  IconUser,
  IconAddressBook,
  IconUserCircle,
  IconChevronDown,
  IconChevronUp,
  IconHash,
} from '@tabler/icons-react';
import type { TemplateConfig } from '../../../../shared/types';
import { SpacingControl, NumberControl, SelectControl, SemanticColorControl, FontSelector, ColorControl, LinkedSpacingControl } from './index';

type SemanticColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'text-primary' | 'text-secondary' | 'text-muted' | 'custom1' | 'custom2' | 'custom3' | 'custom4';

// ============================================
// Common Select Options (DRY constants)
// ============================================

const BORDER_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

const BORDER_STYLE_OPTIONS_EXTENDED = [
  ...BORDER_STYLE_OPTIONS,
  { value: 'double', label: 'Double' },
];

const POSITION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

const SHADOW_OPTIONS_EXTENDED = [
  ...SHADOW_OPTIONS,
  { value: 'xl', label: 'Extra Large' },
];

const FILTER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'sepia', label: 'Sepia' },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPER' },
  { value: 'capitalize', label: 'Title' },
  { value: 'lowercase', label: 'lower' },
];

const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
];

const DIVIDER_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'full-width', label: 'Full Width' },
];

const UNDERLINE_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'always', label: 'Always' },
  { value: 'hover', label: 'On Hover' },
];

const LAYOUT_OPTIONS = [
  { value: 'stacked', label: 'Stacked (vertical)' },
  { value: 'inline', label: 'Inline (wrapped)' },
  { value: 'grid', label: 'Grid (columns)' },
];

const TAG_STYLE_OPTIONS = [
  { value: 'pill', label: 'Pill (rounded)' },
  { value: 'inline', label: 'Inline (text)' },
];

const PAGE_NUMBER_POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

// Define semantic elements that can be styled
type SemanticElement =
  | 'base'
  | 'name'
  | 'sectionHeader'
  | 'jobTitle'
  | 'date'
  | 'tag'
  | 'link'
  | 'contact'
  | 'photo'
  | 'pageNumber';

interface ElementDef {
  id: SemanticElement;
  label: string;
  description: string;
}

// Element definitions
const ELEMENTS: ElementDef[] = [
  { id: 'base', label: 'Base', description: 'Default typography settings' },
  { id: 'name', label: 'Name', description: 'Your name (H1)' },
  { id: 'sectionHeader', label: 'H2', description: 'Section headers' },
  { id: 'jobTitle', label: 'H3', description: 'Job/education titles' },
  { id: 'date', label: 'Date', description: 'Date ranges' },
  { id: 'tag', label: 'Tag', description: 'Skill tags' },
  { id: 'link', label: 'Link', description: 'Hyperlinks' },
  { id: 'contact', label: 'Contact', description: 'Contact info' },
  { id: 'photo', label: 'Photo', description: 'Profile photo' },
  { id: 'pageNumber', label: 'Page #', description: 'Page numbers (PDF)' },
];

// Icons for elements
const ELEMENT_ICONS: Record<SemanticElement, React.ReactNode> = {
  base: <IconTypography size={14} />,
  name: <IconH1 size={14} />,
  sectionHeader: <IconH2 size={14} />,
  jobTitle: <IconH3 size={14} />,
  date: <IconCalendar size={14} />,
  tag: <IconTag size={14} />,
  link: <IconLink size={14} />,
  contact: <IconAddressBook size={14} />,
  photo: <IconUserCircle size={14} />,
  pageNumber: <IconHash size={14} />,
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
        {isOpen ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
      </button>
      {isOpen && <div className="px-2 pb-2">{children}</div>}
    </div>
  );
};

// Reusable Spacing Section with linked/unlinked margin and padding controls
const SpacingSection: React.FC<{
  // Margin props
  marginMode?: 'uniform' | 'individual';
  marginUniform?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  // Padding props
  paddingMode?: 'uniform' | 'individual';
  paddingUniform?: string;
  padding?: string; // Legacy uniform value
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  // Callbacks
  onUpdate: (key: string, value: any) => void;
  // Display options
  showMargin?: boolean;
  showPadding?: boolean;
  defaultMarginValue?: string;
  defaultPaddingValue?: string;
  defaultOpen?: boolean;
}> = ({
  marginMode = 'uniform',
  marginUniform,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  paddingMode = 'uniform',
  paddingUniform,
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  onUpdate,
  showMargin = true,
  showPadding = true,
  defaultMarginValue = '0px',
  defaultPaddingValue = '0px',
  defaultOpen = false,
}) => (
  <Section label="Spacing" defaultOpen={defaultOpen}>
    {showMargin && (
      <LinkedSpacingControl
        label="Margin"
        mode={marginMode}
        uniformValue={marginUniform}
        topValue={marginTop}
        rightValue={marginRight}
        bottomValue={marginBottom}
        leftValue={marginLeft}
        onModeChange={(mode) => onUpdate('marginMode', mode)}
        onUniformChange={(v) => onUpdate('marginUniform', v)}
        onTopChange={(v) => onUpdate('marginTop', v)}
        onRightChange={(v) => onUpdate('marginRight', v)}
        onBottomChange={(v) => onUpdate('marginBottom', v)}
        onLeftChange={(v) => onUpdate('marginLeft', v)}
        defaultValue={defaultMarginValue}
      />
    )}
    {showPadding && (
      <LinkedSpacingControl
        label="Padding"
        mode={paddingMode}
        uniformValue={paddingUniform || padding}
        topValue={paddingTop}
        rightValue={paddingRight}
        bottomValue={paddingBottom}
        leftValue={paddingLeft}
        onModeChange={(mode) => onUpdate('paddingMode', mode)}
        onUniformChange={(v) => onUpdate('paddingUniform', v)}
        onTopChange={(v) => onUpdate('paddingTop', v)}
        onRightChange={(v) => onUpdate('paddingRight', v)}
        onBottomChange={(v) => onUpdate('paddingBottom', v)}
        onLeftChange={(v) => onUpdate('paddingLeft', v)}
        defaultValue={defaultPaddingValue}
      />
    )}
  </Section>
);

// Reusable Background Section
const BackgroundSection: React.FC<{
  backgroundColorKey?: SemanticColor;
  backgroundColorOpacity?: number;
  borderRadius?: string;
  onUpdate: (key: string, value: any) => void;
  defaultColorKey?: SemanticColor;
  defaultOpacity?: number;
  defaultBorderRadius?: string;
  defaultOpen?: boolean;
}> = ({
  backgroundColorKey,
  backgroundColorOpacity,
  borderRadius,
  onUpdate,
  defaultColorKey = 'muted',
  defaultOpacity = 0,
  defaultBorderRadius = '0px',
  defaultOpen = false,
}) => (
  <Section label="Background" defaultOpen={defaultOpen}>
    <SemanticColorControl
      label="Background Color"
      colorKey={backgroundColorKey || defaultColorKey}
      opacity={backgroundColorOpacity ?? defaultOpacity}
      onColorChange={(v) => onUpdate('backgroundColorKey', v)}
      onOpacityChange={(v) => onUpdate('backgroundColorOpacity', v)}
      showOpacity={true}
    />
    <SpacingControl
      label="Border Radius"
      value={borderRadius || defaultBorderRadius}
      onChange={(v) => onUpdate('borderRadius', v)}
      units={['px', 'rem']}
    />
  </Section>
);

// Reusable Border Section (includes divider)
const BorderSection: React.FC<{
  borderStyle?: string;
  borderWidth?: string;
  borderColorKey?: SemanticColor;
  borderColorOpacity?: number;
  dividerStyle?: string;
  dividerWidth?: string;
  dividerColorKey?: SemanticColor;
  dividerColorOpacity?: number;
  onUpdate: (key: string, value: any) => void;
  showDivider?: boolean;
  defaultBorderColorKey?: SemanticColor;
  defaultDividerColorKey?: SemanticColor;
  defaultOpen?: boolean;
}> = ({
  borderStyle,
  borderWidth,
  borderColorKey,
  borderColorOpacity,
  dividerStyle,
  dividerWidth,
  dividerColorKey,
  dividerColorOpacity,
  onUpdate,
  showDivider = true,
  defaultBorderColorKey = 'primary',
  defaultDividerColorKey = 'primary',
  defaultOpen = false,
}) => (
  <Section label="Border" defaultOpen={defaultOpen}>
    <SelectControl
      label="Border Style"
      value={borderStyle || 'none'}
      onChange={(v) => onUpdate('borderStyle', v)}
      options={BORDER_STYLE_OPTIONS}
    />
    {borderStyle && borderStyle !== 'none' && (
      <>
        <SpacingControl
          label="Border Width"
          value={borderWidth || '1px'}
          onChange={(v) => onUpdate('borderWidth', v)}
          units={['px', 'pt']}
        />
        <SemanticColorControl
          label="Border Color"
          colorKey={borderColorKey || defaultBorderColorKey}
          opacity={borderColorOpacity ?? 1}
          onColorChange={(v) => onUpdate('borderColorKey', v)}
          onOpacityChange={(v) => onUpdate('borderColorOpacity', v)}
          showOpacity={true}
        />
      </>
    )}
    {showDivider && (
      <>
        <SelectControl
          label="Bottom Divider"
          value={dividerStyle || 'none'}
          onChange={(v) => onUpdate('dividerStyle', v)}
          options={DIVIDER_STYLE_OPTIONS}
        />
        {dividerStyle && dividerStyle !== 'none' && (
          <>
            <SpacingControl
              label="Divider Width"
              value={dividerWidth || '2px'}
              onChange={(v) => onUpdate('dividerWidth', v)}
              units={['px', 'pt']}
            />
            <SemanticColorControl
              label="Divider Color"
              colorKey={dividerColorKey || defaultDividerColorKey}
              opacity={dividerColorOpacity ?? 1}
              onColorChange={(v) => onUpdate('dividerColorKey', v)}
              onOpacityChange={(v) => onUpdate('dividerColorOpacity', v)}
              showOpacity={true}
            />
          </>
        )}
      </>
    )}
  </Section>
);

// Reusable Shadow Section
const ShadowSection: React.FC<{
  shadow?: string;
  onUpdate: (key: string, value: any) => void;
  defaultOpen?: boolean;
  extended?: boolean;
}> = ({
  shadow,
  onUpdate,
  defaultOpen = false,
  extended = false,
}) => (
  <Section label="Shadow" defaultOpen={defaultOpen}>
    <SelectControl
      label="Shadow"
      value={shadow || 'none'}
      onChange={(v) => onUpdate('shadow', v)}
      options={extended ? SHADOW_OPTIONS_EXTENDED : SHADOW_OPTIONS}
    />
  </Section>
);

// Reusable Typography Section (wraps TypographyControls in Section)
const TypographySection: React.FC<{
  fontSize?: string;
  fontWeight?: number;
  colorKey?: SemanticColor;
  colorOpacity?: number;
  letterSpacing?: string;
  lineHeight?: number;
  textTransform?: string;
  fontStyle?: string;
  onUpdate: (key: string, value: any) => void;
  showLineHeight?: boolean;
  defaultFontSize?: string;
  defaultFontWeight?: number;
  defaultColorKey?: SemanticColor;
  defaultLetterSpacing?: string;
  defaultTextTransform?: string;
  defaultFontStyle?: string;
  children?: React.ReactNode;
}> = ({
  fontSize,
  fontWeight,
  colorKey,
  colorOpacity,
  letterSpacing,
  lineHeight,
  textTransform,
  fontStyle,
  onUpdate,
  showLineHeight = false,
  defaultFontSize = '16px',
  defaultFontWeight = 400,
  defaultColorKey = 'text-primary',
  defaultLetterSpacing = '0em',
  defaultTextTransform = 'none',
  defaultFontStyle = 'normal',
  children,
}) => (
  <Section label="Typography">
    <SpacingControl
      label="Font Size"
      value={fontSize || defaultFontSize}
      onChange={(v) => onUpdate('fontSize', v)}
      units={['px', 'pt', 'rem']}
    />
    <div className="grid grid-cols-2 gap-1">
      <NumberControl
        label="Weight"
        value={fontWeight || defaultFontWeight}
        onChange={(v) => onUpdate('fontWeight', v)}
        min={100}
        max={900}
        step={100}
      />
      {showLineHeight && (
        <NumberControl
          label="Line Height"
          value={lineHeight || 1.4}
          onChange={(v) => onUpdate('lineHeight', v)}
          min={0.8}
          max={3}
          step={0.1}
        />
      )}
    </div>
    <SemanticColorControl
      label="Color"
      colorKey={colorKey || defaultColorKey}
      opacity={colorOpacity ?? 1}
      onColorChange={(v) => onUpdate('colorKey', v)}
      onOpacityChange={(v) => onUpdate('colorOpacity', v)}
      showOpacity={true}
    />
    <SpacingControl
      label="Letter Spacing"
      value={letterSpacing || defaultLetterSpacing}
      onChange={(v) => onUpdate('letterSpacing', v)}
      units={['em', 'px']}
    />
    <div className="grid grid-cols-2 gap-1">
      <SelectControl
        label="Transform"
        value={textTransform || defaultTextTransform}
        onChange={(v) => onUpdate('textTransform', v)}
        options={TEXT_TRANSFORM_OPTIONS}
      />
      <SelectControl
        label="Style"
        value={fontStyle || defaultFontStyle}
        onChange={(v) => onUpdate('fontStyle', v)}
        options={FONT_STYLE_OPTIONS}
      />
    </div>
    {children}
  </Section>
);

// Reusable Effects Section (Shadow + Opacity + Filter)
const EffectsSection: React.FC<{
  shadow?: string;
  opacity?: number;
  filter?: string;
  onUpdate: (key: string, value: any) => void;
  showOpacity?: boolean;
  showFilter?: boolean;
  extendedShadow?: boolean;
  defaultOpen?: boolean;
}> = ({
  shadow,
  opacity,
  filter,
  onUpdate,
  showOpacity = true,
  showFilter = true,
  extendedShadow = true,
  defaultOpen = false,
}) => (
  <Section label="Effects" defaultOpen={defaultOpen}>
    <SelectControl
      label="Shadow"
      value={shadow || 'none'}
      onChange={(v) => onUpdate('shadow', v)}
      options={extendedShadow ? SHADOW_OPTIONS_EXTENDED : SHADOW_OPTIONS}
    />
    {showOpacity && (
      <NumberControl
        label="Opacity"
        value={opacity ?? 1}
        onChange={(v) => onUpdate('opacity', v)}
        min={0}
        max={1}
        step={0.1}
      />
    )}
    {showFilter && (
      <SelectControl
        label="Filter"
        value={filter || 'none'}
        onChange={(v) => onUpdate('filter', v)}
        options={FILTER_OPTIONS}
      />
    )}
  </Section>
);

// Reusable Icon Section
const IconSection: React.FC<{
  iconSize?: string;
  iconColorKey?: SemanticColor;
  iconColorOpacity?: number;
  onUpdate: (key: string, value: any) => void;
  defaultOpen?: boolean;
}> = ({
  iconSize,
  iconColorKey,
  iconColorOpacity,
  onUpdate,
  defaultOpen = false,
}) => (
  <Section label="Icons" defaultOpen={defaultOpen}>
    <SpacingControl
      label="Icon Size"
      value={iconSize || '16px'}
      onChange={(v) => onUpdate('iconSize', v)}
      units={['px', 'rem']}
    />
    <SemanticColorControl
      label="Icon Color"
      colorKey={iconColorKey || 'text-secondary'}
      opacity={iconColorOpacity ?? 1}
      onColorChange={(v) => onUpdate('iconColorKey', v)}
      onOpacityChange={(v) => onUpdate('iconColorOpacity', v)}
      showOpacity={true}
    />
  </Section>
);

// Reusable Hover State Section
const HoverStateSection: React.FC<{
  hoverColorKey?: SemanticColor;
  hoverColorOpacity?: number;
  onUpdate: (key: string, value: any) => void;
  defaultOpen?: boolean;
}> = ({
  hoverColorKey,
  hoverColorOpacity,
  onUpdate,
  defaultOpen = false,
}) => (
  <Section label="Hover State" defaultOpen={defaultOpen}>
    <SemanticColorControl
      label="Hover Color"
      colorKey={hoverColorKey || 'secondary'}
      opacity={hoverColorOpacity ?? 1}
      onColorChange={(v) => onUpdate('hoverColorKey', v)}
      onOpacityChange={(v) => onUpdate('hoverColorOpacity', v)}
      showOpacity={true}
    />
  </Section>
);

// Reusable Decoration Section
const DecorationSection: React.FC<{
  underlineStyle?: string;
  onUpdate: (key: string, value: any) => void;
  defaultOpen?: boolean;
}> = ({
  underlineStyle,
  onUpdate,
  defaultOpen = false,
}) => (
  <Section label="Decoration" defaultOpen={defaultOpen}>
    <SelectControl
      label="Underline"
      value={underlineStyle || 'always'}
      onChange={(v) => onUpdate('underlineStyle', v)}
      options={UNDERLINE_STYLE_OPTIONS}
    />
  </Section>
);

// Reusable Layout Section (for contact info, etc.)
const LayoutSection: React.FC<{
  layout?: string;
  spacing?: string;
  onUpdate: (key: string, value: any) => void;
  defaultOpen?: boolean;
}> = ({
  layout,
  spacing,
  onUpdate,
  defaultOpen = true,
}) => (
  <Section label="Layout" defaultOpen={defaultOpen}>
    <SelectControl
      label="Arrangement"
      value={layout || 'stacked'}
      onChange={(v) => onUpdate('layout', v)}
      options={LAYOUT_OPTIONS}
    />
    <SpacingControl
      label="Spacing"
      value={spacing || '8px'}
      onChange={(v) => onUpdate('spacing', v)}
    />
  </Section>
);

// Reusable Photo Border Section (different from heading borders)
const PhotoBorderSection: React.FC<{
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  onUpdate: (key: string, value: any) => void;
  defaultOpen?: boolean;
}> = ({
  borderRadius,
  borderWidth,
  borderStyle,
  borderColor,
  onUpdate,
  defaultOpen = true,
}) => (
  <Section label="Border" defaultOpen={defaultOpen}>
    <SpacingControl
      label="Border Radius"
      value={borderRadius || '50%'}
      onChange={(v) => onUpdate('borderRadius', v)}
      units={['%', 'px', 'rem']}
    />
    <SpacingControl
      label="Border Width"
      value={borderWidth || '3px'}
      onChange={(v) => onUpdate('borderWidth', v)}
      units={['px', 'pt']}
    />
    <SelectControl
      label="Border Style"
      value={borderStyle || 'solid'}
      onChange={(v) => onUpdate('borderStyle', v)}
      options={BORDER_STYLE_OPTIONS_EXTENDED}
    />
    <ColorControl
      label="Border Color"
      value={borderColor || '#e2e8f0'}
      onChange={(v) => onUpdate('borderColor', v)}
    />
  </Section>
);

// Reusable Size & Position Section (for photo)
const SizePositionSection: React.FC<{
  size?: string;
  position?: string;
  onUpdate: (key: string, value: any) => void;
  defaultOpen?: boolean;
}> = ({
  size,
  position,
  onUpdate,
  defaultOpen = true,
}) => (
  <Section label="Size & Position" defaultOpen={defaultOpen}>
    <SpacingControl
      label="Size"
      value={size || '160px'}
      onChange={(v) => onUpdate('size', v)}
      units={['px', 'rem', '%']}
    />
    <SelectControl
      label="Position"
      value={position || 'center'}
      onChange={(v) => onUpdate('position', v)}
      options={POSITION_OPTIONS}
    />
  </Section>
);

// Shared typography controls component
const TypographyControls: React.FC<{
  fontSize?: string;
  fontWeight?: number;
  colorKey?: SemanticColor;
  colorOpacity?: number;
  letterSpacing?: string;
  lineHeight?: number;
  textTransform?: string;
  fontStyle?: string;
  onUpdate: (key: string, value: any) => void;
  showFontSize?: boolean;
  showFontWeight?: boolean;
  showColor?: boolean;
  showLetterSpacing?: boolean;
  showLineHeight?: boolean;
  showTextTransform?: boolean;
  showFontStyle?: boolean;
  defaultFontSize?: string;
  defaultFontWeight?: number;
  defaultColorKey?: SemanticColor;
  defaultLetterSpacing?: string;
  defaultLineHeight?: number;
  defaultTextTransform?: string;
  defaultFontStyle?: string;
}> = ({
  fontSize,
  fontWeight,
  colorKey,
  colorOpacity,
  letterSpacing,
  lineHeight,
  textTransform,
  fontStyle,
  onUpdate,
  showFontSize = true,
  showFontWeight = true,
  showColor = true,
  showLetterSpacing = true,
  showLineHeight = false,
  showTextTransform = true,
  showFontStyle = true,
  defaultFontSize = '16px',
  defaultFontWeight = 400,
  defaultColorKey = 'text-primary',
  defaultLetterSpacing = '0em',
  defaultLineHeight = 1.4,
  defaultTextTransform = 'none',
  defaultFontStyle = 'normal',
}) => (
  <>
    {showFontSize && (
      <SpacingControl
        label="Font Size"
        value={fontSize || defaultFontSize}
        onChange={(v) => onUpdate('fontSize', v)}
        units={['px', 'pt', 'rem']}
      />
    )}
    <div className="grid grid-cols-2 gap-1">
      {showFontWeight && (
        <NumberControl
          label="Weight"
          value={fontWeight || defaultFontWeight}
          onChange={(v) => onUpdate('fontWeight', v)}
          min={100}
          max={900}
          step={100}
        />
      )}
      {showLineHeight && (
        <NumberControl
          label="Line Height"
          value={lineHeight || defaultLineHeight}
          onChange={(v) => onUpdate('lineHeight', v)}
          min={0.8}
          max={3}
          step={0.1}
        />
      )}
    </div>
    {showColor && (
      <SemanticColorControl
        label="Color"
        colorKey={colorKey || defaultColorKey}
        opacity={colorOpacity ?? 1}
        onColorChange={(v) => onUpdate('colorKey', v)}
        onOpacityChange={(v) => onUpdate('colorOpacity', v)}
        showOpacity={true}
      />
    )}
    {showLetterSpacing && (
      <SpacingControl
        label="Letter Spacing"
        value={letterSpacing || defaultLetterSpacing}
        onChange={(v) => onUpdate('letterSpacing', v)}
        units={['em', 'px']}
      />
    )}
    <div className="grid grid-cols-2 gap-1">
      {showTextTransform && (
        <SelectControl
          label="Transform"
          value={textTransform || defaultTextTransform}
          onChange={(v) => onUpdate('textTransform', v)}
          options={TEXT_TRANSFORM_OPTIONS}
        />
      )}
      {showFontStyle && (
        <SelectControl
          label="Style"
          value={fontStyle || defaultFontStyle}
          onChange={(v) => onUpdate('fontStyle', v)}
          options={FONT_STYLE_OPTIONS}
        />
      )}
    </div>
  </>
);

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
      <Section label="Fonts">
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
      </Section>
      <Section label="Scale">
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
      <Section label="Spacing">
        <SpacingControl
          label="Section Spacing"
          value={config.layout.sectionSpacing}
          onChange={(v) => onChange('layout', { sectionSpacing: v })}
          units={['px', 'rem', 'em']}
        />
        <SpacingControl
          label="Paragraph Spacing"
          value={config.layout.paragraphSpacing}
          onChange={(v) => onChange('layout', { paragraphSpacing: v })}
          units={['px', 'rem', 'em']}
        />
      </Section>
    </>
  );

  // Shared heading editor for Name (H1), Section (H2), and Title (H3)
  const renderHeadingEditor = (
    componentKey: 'name' | 'sectionHeader' | 'jobTitle',
    defaults: {
      fontSize: string;
      fontWeight: number;
      colorKey: SemanticColor;
      letterSpacing: string;
      textTransform: string;
      marginTop?: string;
      marginBottom: string;
      padding?: string;
    }
  ) => {
    const comp = config.components[componentKey] || {};
    const update = (key: string, value: any) => {
      onChange('components', { [componentKey]: { ...config.components[componentKey], [key]: value } });
    };
    return (
      <>
        <Section label="Typography">
          <TypographyControls
            fontSize={comp.fontSize}
            fontWeight={comp.fontWeight}
            colorKey={comp.colorKey}
            colorOpacity={comp.colorOpacity}
            letterSpacing={comp.letterSpacing}
            lineHeight={comp.lineHeight}
            textTransform={comp.textTransform}
            fontStyle={comp.fontStyle}
            onUpdate={update}
            showLineHeight={true}
            defaultFontSize={defaults.fontSize}
            defaultFontWeight={defaults.fontWeight}
            defaultColorKey={defaults.colorKey}
            defaultLetterSpacing={defaults.letterSpacing}
            defaultTextTransform={defaults.textTransform}
          />
        </Section>
        <SpacingSection
          marginMode={comp.marginMode}
          marginUniform={comp.marginUniform}
          marginTop={comp.marginTop}
          marginRight={comp.marginRight}
          marginBottom={comp.marginBottom}
          marginLeft={comp.marginLeft}
          paddingMode={comp.paddingMode}
          paddingUniform={comp.paddingUniform}
          padding={comp.padding}
          paddingTop={comp.paddingTop}
          paddingRight={comp.paddingRight}
          paddingBottom={comp.paddingBottom}
          paddingLeft={comp.paddingLeft}
          onUpdate={update}
          defaultMarginValue={defaults.marginBottom || '8px'}
          defaultPaddingValue={defaults.padding || '0px'}
        />
        <BackgroundSection
          backgroundColorKey={comp.backgroundColorKey as SemanticColor}
          backgroundColorOpacity={comp.backgroundColorOpacity}
          borderRadius={comp.borderRadius}
          onUpdate={update}
        />
        <BorderSection
          borderStyle={comp.borderStyle}
          borderWidth={comp.borderWidth}
          borderColorKey={comp.borderColorKey as SemanticColor}
          borderColorOpacity={comp.borderColorOpacity}
          dividerStyle={comp.dividerStyle}
          dividerWidth={comp.dividerWidth}
          dividerColorKey={comp.dividerColorKey as SemanticColor}
          dividerColorOpacity={comp.dividerColorOpacity}
          onUpdate={update}
        />
        <ShadowSection
          shadow={comp.shadow}
          onUpdate={update}
        />
      </>
    );
  };

  // Render editor for name (H1)
  const renderNameEditor = () => renderHeadingEditor('name', {
    fontSize: '32px',
    fontWeight: 700,
    colorKey: 'text-primary',
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    marginBottom: '8px',
    padding: '0px',
  });

  // Render editor for section headers (H2)
  const renderSectionHeaderEditor = () => renderHeadingEditor('sectionHeader', {
    fontSize: '20px',
    fontWeight: 700,
    colorKey: 'primary',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginTop: '16px',
    marginBottom: '8px',
    padding: '4px 12px',
  });

  // Render editor for job titles (H3)
  const renderJobTitleEditor = () => renderHeadingEditor('jobTitle', {
    fontSize: '18px',
    fontWeight: 600,
    colorKey: 'text-primary',
    letterSpacing: '0em',
    textTransform: 'none',
    marginBottom: '4px',
    padding: '0px',
  });

  // Render editor for dates
  const renderDateEditor = () => {
    const dateLine = config.components.dateLine || {};
    const updateDateLine = (key: string, value: any) => {
      onChange('components', { dateLine: { ...config.components.dateLine, [key]: value } });
    };
    return (
      <TypographySection
        fontSize={dateLine.fontSize}
        fontWeight={dateLine.fontWeight}
        colorKey={dateLine.colorKey}
        colorOpacity={dateLine.colorOpacity}
        letterSpacing={dateLine.letterSpacing}
        textTransform={dateLine.textTransform}
        fontStyle={dateLine.fontStyle}
        onUpdate={updateDateLine}
        defaultFontSize="12px"
        defaultFontWeight={400}
        defaultColorKey="text-secondary"
        defaultLetterSpacing="0em"
        defaultTextTransform="none"
        defaultFontStyle="italic"
      >
        <SelectControl
          label="Alignment"
          value={dateLine.alignment || 'right'}
          onChange={(v) => updateDateLine('alignment', v)}
          options={ALIGNMENT_OPTIONS}
        />
      </TypographySection>
    );
  };

  // Render editor for tags
  const renderTagEditor = () => {
    const tags = config.components.tags || {};
    const updateTag = (key: string, value: any) => {
      onChange('components', { tags: { ...config.components.tags, [key]: value } });
    };
    // Custom update handler for tags (maps colorKey to textColorKey)
    const tagTypographyUpdate = (key: string, value: any) => {
      if (key === 'colorKey') updateTag('textColorKey', value);
      else if (key === 'colorOpacity') updateTag('textOpacity', value);
      else updateTag(key, value);
    };
    return (
      <>
        <TypographySection
          fontSize={tags.fontSize}
          fontWeight={tags.fontWeight}
          colorKey={(tags.textColorKey === 'on-tertiary' ? 'tertiary' : tags.textColorKey) as SemanticColor | undefined}
          colorOpacity={tags.textOpacity}
          letterSpacing={tags.letterSpacing}
          textTransform={tags.textTransform}
          fontStyle={tags.fontStyle}
          onUpdate={tagTypographyUpdate}
          defaultFontSize="12px"
          defaultFontWeight={500}
          defaultColorKey="text-primary"
          defaultLetterSpacing="0em"
          defaultTextTransform="none"
        />
        <Section label="Appearance">
          <SelectControl
            label="Style"
            value={tags.style || 'pill'}
            onChange={(v) => updateTag('style', v)}
            options={TAG_STYLE_OPTIONS}
          />
          <SemanticColorControl
            label="Background"
            colorKey={tags.colorPair || 'tertiary'}
            opacity={tags.backgroundOpacity ?? 0.2}
            onColorChange={(v) => updateTag('colorPair', v)}
            onOpacityChange={(v) => updateTag('backgroundOpacity', v)}
            showOpacity={true}
          />
          <SpacingControl
            label="Border Radius"
            value={tags.borderRadius || '4px'}
            onChange={(v) => updateTag('borderRadius', v)}
            units={['px', 'rem', '%']}
          />
          <SpacingControl
            label="Padding"
            value={tags.padding || '4px 8px'}
            onChange={(v) => updateTag('padding', v)}
          />
          <SpacingControl
            label="Gap"
            value={tags.gap || '8px'}
            onChange={(v) => updateTag('gap', v)}
          />
        </Section>
      </>
    );
  };

  // Render editor for links
  const renderLinkEditor = () => {
    const links = config.components.links || {};
    const updateLink = (key: string, value: any) => {
      onChange('components', { links: { ...config.components.links, [key]: value } });
    };
    return (
      <>
        <TypographySection
          fontSize={links.fontSize}
          fontWeight={links.fontWeight}
          colorKey={links.colorKey}
          colorOpacity={links.colorOpacity}
          letterSpacing={links.letterSpacing}
          textTransform={links.textTransform}
          fontStyle={links.fontStyle}
          onUpdate={updateLink}
          defaultFontSize="inherit"
          defaultFontWeight={500}
          defaultColorKey="primary"
          defaultLetterSpacing="0em"
          defaultTextTransform="none"
        />
        <HoverStateSection
          hoverColorKey={links.hoverColorKey}
          hoverColorOpacity={links.hoverColorOpacity}
          onUpdate={updateLink}
        />
        <DecorationSection
          underlineStyle={links.underlineStyle}
          onUpdate={updateLink}
        />
      </>
    );
  };

  // Render editor for contact
  const renderContactEditor = () => {
    const contactInfo = config.components.contactInfo || {};
    const updateContact = (key: string, value: any) => {
      onChange('components', { contactInfo: { ...config.components.contactInfo, [key]: value } });
    };
    return (
      <>
        <TypographySection
          fontSize={contactInfo.fontSize}
          fontWeight={contactInfo.fontWeight}
          colorKey={contactInfo.colorKey}
          colorOpacity={contactInfo.colorOpacity}
          letterSpacing={contactInfo.letterSpacing}
          textTransform={contactInfo.textTransform}
          fontStyle={contactInfo.fontStyle}
          onUpdate={updateContact}
          defaultFontSize="14px"
          defaultFontWeight={400}
          defaultColorKey="text-secondary"
          defaultLetterSpacing="0em"
          defaultTextTransform="none"
        />
        <LayoutSection
          layout={contactInfo.layout}
          spacing={contactInfo.spacing}
          onUpdate={updateContact}
        />
        <IconSection
          iconSize={contactInfo.iconSize}
          iconColorKey={contactInfo.iconColorKey}
          iconColorOpacity={contactInfo.iconColorOpacity}
          onUpdate={updateContact}
        />
      </>
    );
  };

  // Render editor for photo
  const renderPhotoEditor = () => {
    const profilePhoto = config.components.profilePhoto || {};
    const updatePhoto = (key: string, value: any) => {
      onChange('components', { profilePhoto: { ...config.components.profilePhoto, [key]: value } });
    };
    return (
      <>
        <SizePositionSection
          size={profilePhoto.size}
          position={profilePhoto.position}
          onUpdate={updatePhoto}
        />
        <PhotoBorderSection
          borderRadius={profilePhoto.borderRadius}
          borderWidth={profilePhoto.borderWidth}
          borderStyle={profilePhoto.borderStyle}
          borderColor={profilePhoto.borderColor}
          onUpdate={updatePhoto}
        />
        <SpacingSection
          marginMode={profilePhoto.marginMode}
          marginUniform={profilePhoto.marginUniform}
          marginTop={profilePhoto.marginTop}
          marginRight={profilePhoto.marginRight}
          marginBottom={profilePhoto.marginBottom}
          marginLeft={profilePhoto.marginLeft}
          onUpdate={updatePhoto}
          showPadding={false}
          defaultMarginValue="16px"
        />
        <EffectsSection
          shadow={profilePhoto.shadow}
          opacity={profilePhoto.opacity}
          filter={profilePhoto.filter}
          onUpdate={updatePhoto}
        />
      </>
    );
  };

  // Render editor for page numbers
  const renderPageNumberEditor = () => {
    const pageNumbers = config.pdf.pageNumbers || {};
    const updatePageNumbers = (key: string, value: any) => {
      onChange('pdf', { pageNumbers: { ...config.pdf.pageNumbers, [key]: value } });
    };
    return (
      <>
        <Section label="Typography">
          <SpacingControl
            label="Font Size"
            value={pageNumbers.fontSize || '10px'}
            onChange={(v) => updatePageNumbers('fontSize', v)}
            units={['px', 'pt']}
          />
          <NumberControl
            label="Font Weight"
            value={pageNumbers.fontWeight || 400}
            onChange={(v) => updatePageNumbers('fontWeight', v)}
            min={100}
            max={900}
            step={100}
          />
          <SemanticColorControl
            label="Color"
            colorKey={(pageNumbers.colorKey as SemanticColor) || 'text-secondary'}
            opacity={pageNumbers.colorOpacity ?? 1}
            onColorChange={(v) => updatePageNumbers('colorKey', v)}
            onOpacityChange={(v) => updatePageNumbers('colorOpacity', v)}
            showOpacity={true}
          />
        </Section>
        <Section label="Position" defaultOpen={false}>
          <SelectControl
            label="Placement"
            value={pageNumbers.position || 'bottom-center'}
            onChange={(v) => updatePageNumbers('position', v)}
            options={PAGE_NUMBER_POSITION_OPTIONS}
          />
          <SpacingControl
            label="Margin"
            value={pageNumbers.margin || '10mm'}
            onChange={(v) => updatePageNumbers('margin', v)}
            units={['mm', 'px']}
          />
        </Section>
        <p className="text-[9px] text-text-muted mt-2 px-1">
          Page numbers only appear in PDF export
        </p>
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
      case 'jobTitle':
        return renderJobTitleEditor();
      case 'date':
        return renderDateEditor();
      case 'tag':
        return renderTagEditor();
      case 'link':
        return renderLinkEditor();
      case 'contact':
        return renderContactEditor();
      case 'photo':
        return renderPhotoEditor();
      case 'pageNumber':
        return renderPageNumberEditor();
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
