import React, { useEffect, useRef } from 'react';

interface MathJaxHtmlProps {
  html: string;
}

const MathJaxHtml: React.FC<MathJaxHtmlProps> = ({ html }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
      (window as any).MathJax.typesetPromise([ref.current]);
    }
  }, [html]);

  return <span ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MathJaxHtml;