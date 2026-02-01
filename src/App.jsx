import { useEffect, useMemo, useState } from "react";
import "./App.css";

// ✅ CHANGE THIS if backend is not on 3000
const API_BASE = "http://localhost:3000/api/items";

export default function App() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: "",
    itemName: "",
    itemCategory: "",
    itemPrice: "",
    status: "active",
  });

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.log("LOAD error:", e);
      setError("Failed to load items (check backend is running).");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, limit]);

  function resetForm() {
    setForm({ id: "", itemName: "", itemCategory: "", itemPrice: "", status: "active" });
  }

  async function createItem() {
    setError("");

    const priceNum = Number(form.itemPrice);
    if (!form.itemName || !form.itemCategory || Number.isNaN(priceNum)) {
      setError("Please fill itemName, itemCategory, and itemPrice (number).");
      return;
    }

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: form.itemName,
          itemCategory: form.itemCategory,
          itemPrice: priceNum,
          status: form.status,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Create failed");
        return;
      }

      resetForm();
      load();
    } catch (e) {
      console.log("CREATE error:", e);
      setError("Cannot connect to backend");
    }
  }

  async function updateItem() {
    setError("");

    const priceNum = Number(form.itemPrice);
    if (!form.id) {
      setError("Missing item id");
      return;
    }
    if (!form.itemName || !form.itemCategory || Number.isNaN(priceNum) || !form.status) {
      setError("Please fill all fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: form.itemName,
          itemCategory: form.itemCategory,
          itemPrice: priceNum,
          status: form.status,
        }),
      });

      console.log("PUT status:", res.status);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || `Update failed (HTTP ${res.status})`);
        return;
      }

      resetForm();
      load();
    } catch (e) {
      console.log("UPDATE error:", e);
      setError("Cannot connect to backend");
    }
  }

  async function deleteItem(id) {
    const ok = confirm("Delete this item?");
    if (!ok) return;

    setError("");

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });

      console.log("DELETE status:", res.status);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || `Delete failed (HTTP ${res.status})`);
        return;
      }

      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (e) {
      console.log("DELETE error:", e);
      setError("Cannot connect to backend");
    }
  }

  function startEdit(i) {
    setForm({
      id: i.id,
      itemName: i.itemName,
      itemCategory: i.itemCategory,
      itemPrice: String(i.itemPrice),
      status: i.status,
    });
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2 style={{ textAlign: "center" }}>Item Manager</h2>

      <div style={{ padding: 16, border: "1px solid #444", borderRadius: 12 }}>
        <h3 style={{ textAlign: "center" }}>{isEditing ? "Update Item" : "Create Item"}</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <input
            placeholder="itemName"
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          />
          <input
            placeholder="itemCategory"
            value={form.itemCategory}
            onChange={(e) => setForm({ ...form, itemCategory: e.target.value })}
          />
          <input
            placeholder="itemPrice (number)"
            value={form.itemPrice}
            onChange={(e) => setForm({ ...form, itemPrice: e.target.value })}
          />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="out-of-stock">out-of-stock</option>
          </select>
        </div>

        <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 10 }}>
          {!isEditing ? (
            <button onClick={createItem}>Insert</button>
          ) : (
            <button onClick={updateItem}>Update</button>
          )}
          <button onClick={resetForm}>Clear</button>
        </div>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>

        <span style={{ marginLeft: 10 }}>Limit:</span>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <button onClick={load}>Refresh</button>
      </div>

      <table width="100%" border="1" cellPadding="10" style={{ marginTop: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th width="160">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5">Loading...</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan="5">No items</td></tr>
          ) : (
            items.map((i) => (
              <tr key={i.id}>
                <td>{i.itemName}</td>
                <td>{i.itemCategory}</td>
                <td>{i.itemPrice}</td>
                <td>{i.status}</td>
                <td>
                  <button onClick={() => startEdit(i)}>Edit</button>
                  <button onClick={() => deleteItem(i.id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p style={{ marginTop: 10, color: "#888", textAlign: "center" }}>
        Backend should run at <b>http://localhost:3000</b> (change API_BASE if needed).
      </p>
    </div>
  );
}
