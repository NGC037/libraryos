"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function CirculationDesk() {
  const [barcode, setBarcode] = useState("");
  const [personId, setPersonId] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkout = trpc.circulation.checkout.useMutation({
    onSuccess: (data) => {
      setLastResult(
        `Checked out. Due ${new Date(data.loan.dueAt).toLocaleDateString()}.`,
      );
      setLastError(null);
    },
    onError: (err) => {
      setLastError(err.message);
      setLastResult(null);
    },
  });

  const returnItem = trpc.circulation.returnItem.useMutation({
    onSuccess: () => {
      setLastResult("Returned successfully.");
      setLastError(null);
    },
    onError: (err) => {
      setLastError(err.message);
      setLastResult(null);
    },
  });

  const locate = trpc.catalog.locateCopy.useQuery(
    { barcode },
    { enabled: false },
  );

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <h1>Circulation Desk</h1>

      <div style={{ marginTop: 24 }}>
        <label>Copy barcode</label>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="RC-000123"
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Person ID (borrower)</label>
        <input
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          placeholder="uuid"
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button
          onClick={() =>
            checkout.mutate({
              barcode,
              personId,
              idempotencyKey: crypto.randomUUID(),
            })
          }
          disabled={checkout.isPending}
        >
          Check out
        </button>
        <button
          onClick={() =>
            returnItem.mutate({ barcode, idempotencyKey: crypto.randomUUID() })
          }
          disabled={returnItem.isPending}
        >
          Return
        </button>
        <button onClick={() => locate.refetch()}>Locate</button>
      </div>

      {lastResult && (
        <p style={{ marginTop: 20, color: "green" }}>{lastResult}</p>
      )}
      {lastError && (
        <p style={{ marginTop: 20, color: "crimson" }}>{lastError}</p>
      )}

      {locate.data && (
        <div style={{ marginTop: 20, padding: 12, border: "1px solid #ccc" }}>
          <strong>{locate.data.title}</strong> — {locate.data.status}
          {locate.data.location && <p>{locate.data.location.path}</p>}
        </div>
      )}
    </div>
  );
}
