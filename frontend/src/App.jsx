import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardPage from "./pages/DashboardPage";
import SitesPage from "./pages/SitesPage";
import InstallationsPage from "./pages/InstallationsPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage />;
      case "sites":
        return <SitesPage />;
      case "installations":
        return <InstallationsPage />;
      case "users":
        return <UsersPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="main-content">
        <Header
          activeTab={activeTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main>{renderContent()}</main>
      </div>
    </div>
  );
}
