import { useInView } from '../../hooks/useInView';

/**
 * Wraps children in a scroll-reveal animation (opacity + translateY).
 * Degrades to instantly-visible under prefers-reduced-motion (see utilities.css).
 */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
