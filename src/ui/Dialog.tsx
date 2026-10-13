import type { ComponentChildren } from 'preact';

interface Props {
  title: string;
  children?: ComponentChildren;
  actions: { label: string; onClick: () => void; primary?: boolean; danger?: boolean }[];
  onClose: () => void;
}

export function Dialog({ title, children, actions, onClose }: Props) {
  return (
    <div class="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <div class="dialog-actions">
          {actions.map((a) => (
            <button key={a.label} class={`btn${a.primary ? ' primary' : ''}${a.danger ? ' danger' : ''}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
