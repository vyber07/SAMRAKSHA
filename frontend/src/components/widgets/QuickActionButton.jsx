import { useState } from 'react';

const COLOR_MAP = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  tertiary: 'var(--tertiary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
};

function resolveColor(color) {
  if (!color) return 'var(--primary)';
  return COLOR_MAP[color] || color;
}

export default function QuickActionButton({
  icon,
  label,
  variant = 'filled',
  color = 'primary',
  onClick,
}) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const accent = resolveColor(color);

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 600,
    padding: '10px 18px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1), background 300ms cubic-bezier(0.4,0,0.2,1)',
    transform: pressed ? 'scale(0.97)' : hover ? 'translateY(-2px)' : 'translateY(0)',
  };

  let variantStyle;
  if (variant === 'outlined') {
    variantStyle = {
      background: hover ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'transparent',
      color: accent,
      border: `1.5px solid color-mix(in srgb, ${accent} 60%, transparent)`,
      boxShadow: hover ? `0 6px 16px color-mix(in srgb, ${accent} 22%, transparent)` : 'none',
    };
  } else if (variant === 'tonal') {
    variantStyle = {
      background: hover
        ? `color-mix(in srgb, ${accent} 28%, transparent)`
        : `color-mix(in srgb, ${accent} 18%, transparent)`,
      color: accent,
      border: '1px solid transparent',
      boxShadow: hover ? `0 6px 18px color-mix(in srgb, ${accent} 24%, transparent)` : 'none',
    };
  } else {
    // filled
    variantStyle = {
      background: accent,
      color: '#ffffff',
      border: '1px solid transparent',
      boxShadow: hover
        ? `0 8px 22px color-mix(in srgb, ${accent} 45%, transparent)`
        : `0 2px 8px color-mix(in srgb, ${accent} 30%, transparent)`,
    };
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{ ...base, ...variantStyle }}
    >
      {icon != null && (
        <span className="material-symbols-outlined" style={{ fontSize: '18px', lineHeight: 1 }}>
          {icon}
        </span>
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
