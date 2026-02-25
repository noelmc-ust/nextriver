"use client";

import Link from "next/link";
import { API_BASE } from "./lib/apiBase";

export default function Navbar() {
  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // Redirect regardless of result
      window.location.href = "/";
    }
  };

  return (
    <nav className="nav">
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="brand">
          La <em>Rivera</em>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/">Home</Link>
          <Link href="/catalog">Catalog</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/account">Account</Link>

          {/* Show only one of these depending on auth, but keeping your buttons */}
          <a className="btn ghost" href="#" onClick={handleLogout}>
            Logout
          </a>
          <Link className="btn ghost" href="/login">
            Sign In
          </Link>
          <Link className="btn" href="/signup">
            Create Account
          </Link>
        </div>
      </div>
    </nav>
  );
}