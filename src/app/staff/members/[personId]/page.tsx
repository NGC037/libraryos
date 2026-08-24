"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";

export default function MemberLogCard({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = use(params);

  const logCard = trpc.memberLogCard.getForPerson.useQuery({ personId });
  const credentials = trpc.credentials.listForPerson.useQuery({ personId });

  return (
    <div style={{ padding: 40, maxWidth: 700 }}>
      <h1>Member Log Card</h1>
      <p style={{ color: "#888", fontSize: 13 }}>Person ID: {personId}</p>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16 }}>Credentials</h2>
        {credentials.isLoading && <p>Loading…</p>}
        {credentials.data?.length === 0 && (
          <p style={{ color: "#888" }}>No credentials issued.</p>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {credentials.data?.map((c) => (
            <li
              key={c.id}
              style={{
                padding: "8px 12px",
                border: "1px solid #333",
                borderRadius: 4,
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{c.type.toUpperCase()}</span>
              <span style={{ color: c.status === "active" ? "green" : "#888" }}>
                {c.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16 }}>Timeline</h2>
        {logCard.isLoading && <p>Loading…</p>}
        {logCard.error && (
          <p style={{ color: "crimson" }}>{logCard.error.message}</p>
        )}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {logCard.data?.map((event) => {
            const isRestricted = event.summary === "[Restricted entry]";
            return (
              <li
                key={event.id}
                style={{
                  padding: "10px 12px",
                  borderLeft: `3px solid ${isRestricted ? "#666" : "#4a9"}`,
                  marginBottom: 8,
                  background: "#111",
                }}
              >
                <div style={{ fontSize: 12, color: "#888" }}>
                  {new Date(event.occurredAt).toLocaleString()} ·{" "}
                  {event.eventType}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontStyle: isRestricted ? "italic" : "normal",
                  }}
                >
                  {event.summary}
                </div>
              </li>
            );
          })}
        </ul>

        {logCard.data?.length === 0 && (
          <p style={{ color: "#888" }}>No events yet.</p>
        )}
      </section>
    </div>
  );
}
