import React from 'react';

interface BoxModel {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface BoxModelControlProps {
  label: string;
  value: BoxModel;
  onChange: (value: BoxModel) => void;
  description?: string;
  type?: 'margin' | 'padding';
}

export const BoxModelControl: React.FC<BoxModelControlProps> = ({
  label,
  value,
  onChange,
  description,
  type = 'margin',
}) => {
  const handleChange = (side: keyof BoxModel, newValue: string) => {
    onChange({
      ...value,
      [side]: newValue,
    });
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-secondary mb-2">{description}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-secondary">Top</label>
          <input
            type="text"
            value={value.top}
            onChange={(e) => handleChange('top', e.target.value)}
            placeholder="0px"
            className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary">Right</label>
          <input
            type="text"
            value={value.right}
            onChange={(e) => handleChange('right', e.target.value)}
            placeholder="0px"
            className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary">Bottom</label>
          <input
            type="text"
            value={value.bottom}
            onChange={(e) => handleChange('bottom', e.target.value)}
            placeholder="0px"
            className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary">Left</label>
          <input
            type="text"
            value={value.left}
            onChange={(e) => handleChange('left', e.target.value)}
            placeholder="0px"
            className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};
