import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <h1>404 - Page Not Found</h1>
      <p>The requested ledger record or document does not exist.</p>
      <Link href="/" className="badge badge-active" style={{ textDecoration: "none" }}>
        Return to Home
      </Link>
    </div>
  );
}
