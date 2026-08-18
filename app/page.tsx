"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Mail, 
  ShieldCheck, 
  AlertTriangle 
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  url: string;
  image?: string;
  price?: string;
  availability: "AVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
  isMonitoring: boolean;
  lastChecked?: string;
  lastAvailable?: string;
  lastNotificationSent?: string;
}

interface LogEntry {
  _id: string;
  productName: string;
  recipientEmail: string;
  status: "SUCCESS" | "FAILED";
  message: string;
  sentAt: string;
  error?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load logs", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchLogs();
  }, []);

  const triggerManualCheck = async () => {
    setChecking(true);
    setStatusMsg({ text: "Checking stock across all products...", type: "success" });
    try {
      const res = await fetch("/api/monitor");
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: `Checked ${data.checkedCount} products successfully!`, type: "success" });
        await fetchProducts();
        await fetchLogs();
      } else {
        setStatusMsg({ text: `Error checking stock: ${data.error}`, type: "error" });
      }
    } catch (err: any) {
      setStatusMsg({ text: "Network error triggering check", type: "error" });
    } finally {
      setChecking(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const toggleMonitoring = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMonitoring: !currentState }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, isMonitoring: !currentState } : p))
        );
      }
    } catch (err) {
      console.error("Failed to update toggle", err);
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewUrl("");
        setStatusMsg({ text: "Product added successfully!", type: "success" });
        await fetchProducts();
      } else {
        setStatusMsg({ text: data.error || "Failed to add product", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: "Error adding product", type: "error" });
    } finally {
      setAdding(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to stop tracking this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Bar / Header */}
      <header className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-700 rounded-xl shadow-lg shadow-green-900/30">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Amul Stock Alert
            </h1>
            <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Direct Email Notifications &bull; <span className="text-emerald-400 font-mono">shivamhippalgave@gmail.com</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={triggerManualCheck}
            disabled={checking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Stock..." : "Check Stock Now"}
          </button>
        </div>
      </header>

      {/* Status Message Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            statusMsg.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50"
              : "bg-rose-950/80 text-rose-300 border border-rose-800/50"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          {statusMsg.text}
        </div>
      )}

      {/* Add New Product Form */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-400" /> Track New Amul Product
        </h2>
        <form onSubmit={addProduct} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste Amul product URL (e.g. https://shop.amul.com/en/product/...)"
            className="flex-1 bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {adding ? "Adding..." : "Add Product"}
          </button>
        </form>
      </section>

      {/* Product Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center justify-between">
          <span>Monitored Products ({products.length})</span>
          <span className="text-xs font-normal text-slate-400">Auto-checks every 30 mins</span>
        </h2>

        {loading ? (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p>Connecting to database & loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl text-slate-400 space-y-3">
            <p className="text-lg">No products added yet.</p>
            <p className="text-sm text-slate-500">Paste an Amul shop product link above to start tracking!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {products.map((product) => {
              const isAvailable = product.availability === "AVAILABLE";
              const isOutOfStock = product.availability === "OUT_OF_STOCK";

              return (
                <div
                  key={product._id}
                  className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-lg hover:shadow-blue-950/20"
                >
                  <div className="space-y-3">
                    {/* Header Row: Stock Tag + Toggle Switch */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isAvailable
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : isOutOfStock
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE NOW
                          </>
                        ) : isOutOfStock ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> OUT OF STOCK
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> UNKNOWN / CHECKING
                          </>
                        )}
                      </span>

                      {/* Monitoring Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-xs text-slate-400 font-medium">
                          {product.isMonitoring ? "Alerts ON" : "Alerts OFF"}
                        </span>
                        <input
                          type="checkbox"
                          checked={product.isMonitoring}
                          onChange={() => toggleMonitoring(product._id, product.isMonitoring)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                      </label>
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3 className="font-bold text-slate-100 text-lg leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      {product.price && (
                        <p className="text-sm font-semibold text-amber-400 mt-1">{product.price}</p>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Last check:{" "}
                        {product.lastChecked
                          ? new Date(product.lastChecked).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </span>
                      {product.lastNotificationSent && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Mail className="w-3.5 h-3.5" /> Alerted:{" "}
                          {new Date(product.lastNotificationSent).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/50"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Open Amul Page
                      </a>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Email Alert Logs Section */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-400" /> Recent Email Alert Dispatch Logs
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No email alerts sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.slice(0, 10).map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-slate-400">
                      {new Date(log.sentAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 font-medium text-slate-200">{log.productName}</td>
                    <td className="p-3 font-mono text-slate-400">{log.recipientEmail}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          log.status === "SUCCESS" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {log.status === "SUCCESS" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> SENT
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> FAILED
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
