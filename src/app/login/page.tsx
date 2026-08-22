"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="neha@example.com"
      />
      <button onClick={() => signIn("credentials", { email, redirect: false })}>
        Sign in
      </button>
    </div>
  );
}
