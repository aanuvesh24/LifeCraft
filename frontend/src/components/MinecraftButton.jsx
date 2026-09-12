import React from 'react';
import { motion } from 'framer-motion';

export default function MinecraftButton({
  children,
  onClick,
  variant = 'default',
  className = '',
  disabled = false,
  fullWidth = true,
  icon = null,
}) {
  let variantClass = 'mc-button-base';
  if (variant === 'primary') variantClass = 'mc-button-primary';
  if (variant === 'danger') variantClass = 'mc-button-danger';

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.98, y: 2 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClass}
        ${fullWidth ? 'w-full' : ''}
        rounded-none
        py-3 px-5
        font-pixel text-xs md:text-sm
        uppercase tracking-widest
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}
