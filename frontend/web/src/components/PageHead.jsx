import React from 'react';

// Title left, optional one-line meta under it, actions right. No eyebrow, no numbering: the title speaks.
const PageHead = ({ title, meta, children }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div className="min-w-0">
      <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
      {meta ? <p className="mt-1 text-[12px] text-muted">{meta}</p> : null}
    </div>
    {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
  </header>
);

export default PageHead;
