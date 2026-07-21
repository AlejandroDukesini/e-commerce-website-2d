import { Link } from 'react-router-dom';

/**
 * Polymorphic button: renders a <button>, an <a>, or a react-router <Link>
 * depending on props — while sharing one visual system.
 */
export function Button({
  variant = 'primary',
  size,
  block = false,
  to,
  href,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) return <Link to={to} className={classes} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={classes} {...rest}>{children}</a>;
  return <button className={classes} {...rest}>{children}</button>;
}
