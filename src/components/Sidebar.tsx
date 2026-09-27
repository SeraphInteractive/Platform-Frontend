"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isSupervisor, login, logout, isLoading } = useAuth();
  const canAccessAdmin = isAdmin || isSupervisor;

  const links = [
    { href: "/", label: "Home" },
    { href: "/voting", label: "Voting" },
    { href: "/leaderboards", label: "Leaderboard" },
    { href: "/grabbox", label: "Grab-Box" },
    { href: "/progress", label: "Roadmap" },
    { href: "/documentation", label: "Documentation" }
  ];

  return (
    <aside style={{ width: "200px", flexShrink: 0 }}>
      {/* branding box */}
      <fieldset className="grab-box" style={{ margin: "0 0 10px 0" }}>
        <legend>Platform</legend>
        <div style={{ fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia, serif" }}>
          PROJECT STAIRWAY
        </div>
      </fieldset>

      {/* navigation menu */}
      <fieldset className="grab-box" style={{ margin: "0 0 10px 0" }}>
        <legend>Navigation</legend>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    display: "block",
                    padding: "3px 6px",
                    backgroundColor: active ? "#dfdbd1" : "transparent",
                    fontWeight: active ? "bold" : "normal",
                    border: active ? "1px solid #808080" : "1px solid transparent",
                    textDecoration: active ? "none" : "underline"
                  }}
                >
                  {active ? `\u25B6 ${link.label}` : link.label}
                </Link>
              </li>
            );
          })}

          {/* admin console link is only visible when an authenticated admin or supervisor is active */}
          {canAccessAdmin && (
            <li style={{ marginTop: "4px", borderTop: "1px dashed #808080", paddingTop: "4px" }}>
              <Link
                href="/admin"
                style={{
                  display: "block",
                  padding: "3px 6px",
                  color: "#800000",
                  backgroundColor: pathname === "/admin" ? "#dfdbd1" : "transparent",
                  fontWeight: pathname === "/admin" ? "bold" : "normal",
                  border: pathname === "/admin" ? "1px solid #808080" : "1px solid transparent",
                  textDecoration: pathname === "/admin" ? "none" : "underline"
                }}
              >
                {pathname === "/admin" ? "\u25B6 Admin" : "* Admin"}
              </Link>
            </li>
          )}
        </ul>
      </fieldset>

      {/* user session */}
      <fieldset className="grab-box" style={{ margin: "0 0 10px 0" }}>
        <legend>Account</legend>
        {isLoading ? (
          <div style={{ fontSize: "11px", color: "#666" }}>Checking session...</div>
        ) : user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
            <div>
              <strong>{user.globalName || user.username}</strong>
            </div>
            <div>
              <span className="badge badge-active">{user.role.toUpperCase()}</span>
              {isAdmin && <span className="badge badge-admin" style={{ marginLeft: "4px" }}>ADMIN</span>}
            </div>
            <button
              type="button"
              className="action-btn"
              onClick={logout}
              style={{ width: "100%", marginTop: "4px" }}
            >
              Log Out
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              className="action-btn"
              onClick={login}
              style={{ width: "100%", fontSize: "11px" }}
            >
              Log in with Discord
            </button>
          </div>
        )}
      </fieldset>

      {/* backend connection status */}
      <fieldset className="grab-box" style={{ margin: 0, fontSize: "10px", color: "#555" }}>
        <legend>System</legend>
        <div>Backend: <span style={{ color: "green", fontWeight: "bold" }}>ONLINE</span></div>
        <div>Database: <span style={{ color: "green", fontWeight: "bold" }}>CONNECTED</span></div>
      </fieldset>
    </aside>
  );
}
