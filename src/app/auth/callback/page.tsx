"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing Discord authentication...");

  useEffect(() => {
    // extract one-time exchange code from fragment or query
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash || window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      setStatus(`Authentication failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus("No authentication code received.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const codeVerifier =
          sessionStorage.getItem("stairway_code_verifier") ||
          localStorage.getItem("stairway_code_verifier") ||
          "";

        const res = await fetch(`/api/v1/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, codeVerifier })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || `Authentication failed (${res.status})`);
        }

        const json = await res.json();
        const sessionData = json?.data;
        const token = sessionData?.token;
        if (!token) {
          throw new Error("No bearer token returned in response");
        }

        // save session data locally for immediate zero-latency auth state
        localStorage.setItem("stairway_token", token);
        if (sessionData.user) {
          localStorage.setItem("stairway_user", JSON.stringify(sessionData.user));
        }
        sessionStorage.removeItem("stairway_code_verifier");

        // fast replace to skip artificial delay
        window.location.replace("/");
      } catch (err: unknown) {
        setStatus(`Error during login: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    exchangeCode();
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <h1>Authenticating...</h1>
      <p>{status}</p>
    </div>
  );
}
