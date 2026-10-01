import React, { useState } from 'react';

// Switch with the "Toggle" transition from transitions.dev: the thumb slides with a double
// bounce (overshoots, swings back, settles) while the track colour cross-fades. The CSS is in
// App.css under the .t-toggle namespace; `.is-init` keeps the keyframes from playing on mount
// and prefers-reduced-motion turns the bounce off.
const Toggle = ({ checked, onChange, disabled, ...rest }) => {
  const [init, setInit] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-on={checked ? 'true' : 'false'}
      disabled={disabled}
      onClick={() => {
        setInit(true);
        onChange(!checked);
      }}
      className={`t-toggle inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-border'
      }${init ? ' is-init' : ''}`}
      {...rest}
    >
      <span className="t-toggle-thumb block h-4 w-4 rounded-full bg-white shadow-sm" aria-hidden="true" />
    </button>
  );
};

export default Toggle;
