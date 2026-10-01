"use client";

import { Menu, WalletCards } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({
  onMenuClick,
}: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div className="mobile-brand">
        <div className="mobile-brand-symbol">
          <WalletCards size={20} />
        </div>

        <strong>CredBox</strong>
      </div>

      <button
        type="button"
        className="mobile-menu-button"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu size={23} />
      </button>
    </header>
  );
}