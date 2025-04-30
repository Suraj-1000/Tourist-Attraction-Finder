import React from 'react';
import './AuthFooter.css';

export default function AuthFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="auth-footer">
      <p>&copy; {currentYear} Explore Nepal. All rights reserved.</p>
    </footer>
  );
} 