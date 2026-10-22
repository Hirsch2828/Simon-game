import { forwardRef, type ButtonHTMLAttributes } from 'react';
import './PrimaryButton.css';

const PrimaryButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function PrimaryButton({ className = '', ...props }, ref) {
    return <button ref={ref} type="button" className={`primary-button ${className}`} {...props} />;
  },
);

export default PrimaryButton;
