import React from "react";
import { LayoutDashboard, Building2, Wrench, Users } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sites", label: "Sites", icon: Building2 },
    { id: "installations", label: "Installations", icon: Wrench },
    { id: "users", label: "Users", icon: Users },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`} aria-label="Main Navigation">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon-wrap">
            <Building2 size={18} />
          </div>
          <span>SiteOps ERP</span>
        </div>
        <div className="sidebar-subtitle">Operations Management</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? "active" : ""}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
