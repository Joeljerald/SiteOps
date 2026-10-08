import React from "react";
import { Menu, X } from "lucide-react";

export default function Header({ activeTab, mobileOpen, setMobileOpen }) {
  const titles = {
    dashboard: "Operations Dashboard",
    sites: "Site Portfolio",
    installations: "Installation Work Orders",
    users: "User Directory",
  };

  return (
    <header className="top-header">
      <div className="header-title-container">
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div>
          <h2 className="header-view-title">{titles[activeTab] || "Site Operations"}</h2>
        </div>
      </div>
    </header>
  );
}
