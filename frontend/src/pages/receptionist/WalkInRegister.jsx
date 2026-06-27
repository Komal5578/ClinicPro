import { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import {
  searchPatient,
  registerPatient,
  registerWalkIn,
  getTodayWalkIns,
  updateWalkInStatus,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const WalkInRegister = () => {
  const { user, selectedClinicId } = useAuth();
  const clinic_id = selectedClinicId || user?.clinic_id || 1;
  const doctor_id = user?.id || 1;

  const [phone, setPhone] = useState("");
  const [patient, setPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
  });
  const [walkInForm, setWalkInForm] = useState({
    priority: "REGULAR",
    chief_complaint: "",
  });
  const [walkIns, setWalkIns] = useState([]);
  const [step, setStep] = useState("search");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWalkIns = async () => {
    try {
      const res = await getTodayWalkIns(clinic_id);
      const data = res?.data ?? res ?? [];
      setWalkIns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setWalkIns([]);
    }
  };

  useEffect(() => {
    fetchWalkIns();
  }, []);
  const handleSearch = async () => {
    if (!phone || phone.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await searchPatient(phone);
      setPatient(res.data);
      setStep("walkin");
    } catch (err) {
      // fetch throws Error with message "API error: 404" when not found
      if (err.message?.includes("404")) {
        setNewPatient((p) => ({ ...p, phone }));
        setStep("register");
      } else {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await registerPatient(newPatient);
      setPatient({
        patient_id: res.data.patient_id,
        ...newPatient,
        name: newPatient.name,
      });
      setStep("walkin");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWalkIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await registerWalkIn({
        patient_id: patient.patient_id || patient.id,
        doctor_id,
        clinic_id,
        priority: walkInForm.priority,
        chief_complaint: walkInForm.chief_complaint,
      });
      setToken(res.data?.token_number || walkIns.length + 1);
      setStep("done");
      fetchWalkIns();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register walk-in");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhone("");
    setPatient(null);
    setNewPatient({ name: "", age: "", phone: "", email: "" });
    setWalkInForm({ priority: "REGULAR", chief_complaint: "" });
    setStep("search");
    setError("");
    setToken(null);
  };

  const handleDone = async (walkin_id) => {
    try {
      await updateWalkInStatus(walkin_id, { status: 'DONE' });
      fetchWalkIns();
    } catch (err) {
      console.error(err);
    }
  };

  const waiting = (walkIns || []).filter((w) => w.status === "WAITING").length;
  const inConsult = (walkIns || []).filter(
    (w) => w.status === "IN_CONSULTATION",
  ).length;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2>Walk-in Registration</h2>
          <p>Register patients and manage today's walk-in queue</p>
        </div>

        <div className="grid-2" style={{ gap: 28, alignItems: "start" }}>
          {/* LEFT: Registration flow */}
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[
                { key: "search", label: "1. Find" },
                { key: "register", label: "2. Register" },
                { key: "walkin", label: "3. Add to Queue" },
                { key: "done", label: "4. Done" },
              ].map((s) => {
                const steps = ["search", "register", "walkin", "done"];
                const current = steps.indexOf(step);
                const idx = steps.indexOf(s.key);
                const isActive = step === s.key;
                const isDone = idx < current;
                const isVisible = s.key !== "register" || step === "register";
                if (!isVisible) return null;
                return (
                  <div
                    key={s.key}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 700,
                      background: isActive
                        ? "#2563eb"
                        : isDone
                          ? "#d1fae5"
                          : "#f1f5f9",
                      color: isActive
                        ? "white"
                        : isDone
                          ? "#059669"
                          : "#94a3b8",
                    }}
                  >
                    {isDone ? " " : ""}
                    {s.label}
                  </div>
                );
              })}
            </div>

            <div className="card">
              {error && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: 18 }}
                >
                  {error}
                </div>
              )}

              {/* STEP: Search */}
              {step === "search" && (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <h3
                      style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}
                    >
                      Find Patient
                    </h3>
                    <p style={{ color: "#64748b", fontSize: 13 }}>
                      Search by phone to find returning patients
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div className="search-bar">
                      <input
                        className="form-input"
                        placeholder="Enter 10-digit phone..."
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: "0.5px",
                        }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        {loading ? "..." : "Search"}
                      </button>
                    </div>
                  </div>
                  <div
                    style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 4 }}
                  >
                    New patients will be prompted to register
                  </div>
                </div>
              )}

              {/* STEP: Register new patient */}
              {step === "register" && (
                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: 20 }}>
                    <h3
                      style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}
                    >
                      New Patient
                    </h3>
                    <div
                      style={{
                        display: "inline-flex",
                        padding: "4px 10px",
                        background: "#fef3c7",
                        color: "#92400e",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Not found in system · Creating new record
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Full Name *</label>
                      <input
                        className="form-input"
                        placeholder="Patient's full name"
                        value={newPatient.name}
                        onChange={(e) =>
                          setNewPatient((p) => ({ ...p, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Age *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Age"
                        min="1"
                        max="120"
                        value={newPatient.age}
                        onChange={(e) =>
                          setNewPatient((p) => ({ ...p, age: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      value={newPatient.phone}
                      readOnly
                      style={{ background: "#f8fafc", color: "#64748b" }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Email{" "}
                      <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="patient@email.com"
                      value={newPatient.email}
                      onChange={(e) =>
                        setNewPatient((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={reset}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? "Saving..." : "Register Patient →"}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP: Walk-in details */}
              {step === "walkin" && patient && (
                <form onSubmit={handleWalkIn}>
                  <div style={{ marginBottom: 20 }}>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      Patient Found
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        background: "#f0fdf4",
                        borderRadius: 10,
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      <div className="patient-avatar">
                        {patient.name?.[0] || "?"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                          {patient.name}
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748b" }}>
                          Age {patient.age} · {patient.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority Level</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        {
                          val: "REGULAR",
                          label: "Regular",
                          color: "#64748b",
                          bg: "#f1f5f9",
                        },
                        {
                          val: "PRIORITY",
                          label: "Priority",
                          color: "#d97706",
                          bg: "#fef3c7",
                        },
                        {
                          val: "URGENT",
                          label: "Urgent",
                          color: "#dc2626",
                          bg: "#fee2e2",
                        },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() =>
                            setWalkInForm((f) => ({ ...f, priority: p.val }))
                          }
                          style={{
                            flex: 1,
                            padding: "8px 10px",
                            borderRadius: 9,
                            border: `1.5px solid ${walkInForm.priority === p.val ? p.color : "#e2e8f0"}`,
                            background:
                              walkInForm.priority === p.val ? p.bg : "white",
                            color:
                              walkInForm.priority === p.val
                                ? p.color
                                : "#64748b",
                            fontWeight: 700,
                            fontSize: 12.5,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Chief Complaint{" "}
                      <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g. Fever and headache since 2 days"
                      value={walkInForm.chief_complaint}
                      onChange={(e) =>
                        setWalkInForm((f) => ({
                          ...f,
                          chief_complaint: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={reset}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? "Adding..." : "Add to Queue"}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP: Done */}
              {step === "done" && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      margin: "0 auto 20px",
                    }}
                  >
                    ✓
                  </div>
                  <h3
                    style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}
                  >
                    Added to Queue!
                  </h3>
                  {token && (
                    <div
                      style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: "#2563eb",
                        fontFamily: "'JetBrains Mono', monospace",
                        margin: "16px 0 8px",
                        letterSpacing: "-2px",
                      }}
                    >
                      W{token}
                    </div>
                  )}
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: 13.5,
                      marginBottom: 6,
                    }}
                  >
                    Token number assigned
                  </p>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: 12.5,
                      marginBottom: 28,
                    }}
                  >
                    {waiting + 1} patient{waiting + 1 !== 1 ? "s" : ""} now in
                    queue
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={reset}
                    style={{ width: "100%" }}
                  >
                    + Register Another Patient
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Today's queue */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Today's Queue</h3>
                <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
                  {waiting} waiting · {inConsult} in consult
                </p>
              </div>
              <span className="badge badge-primary">
                {walkIns.length} total
              </span>
            </div>

            {walkIns.length === 0 ? (
              <div className="empty-state" style={{ padding: "36px 16px" }}>
                <div className="empty-state-icon"></div>
                <p>Queue is empty</p>
                <p style={{ fontSize: 12.5 }}>
                  Register the first walk-in above
                </p>
              </div>
            ) : (
              <div
                style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}
              >
                {walkIns.map((w) => (
                  <div
                    key={w.walkin_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: w.status === "DONE" ? "#fafafa" : "white",
                      marginBottom: 8,
                      border: `1px solid ${w.priority === "URGENT" ? "#fecaca" : "#f1f5f9"}`,
                      borderLeft: `3px solid ${w.priority === "URGENT" ? "#dc2626" : w.priority === "PRIORITY" ? "#d97706" : "#e2e8f0"}`,
                      opacity: w.status === "DONE" ? 0.6 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <div className="token-badge" style={{ fontSize: 11 }}>
                      W{w.token_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                        {w.patient_name}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#64748b",
                          marginTop: 1,
                        }}
                      >
                        {w.chief_complaint || "No complaint noted"}
                      </div>
                    </div>
                    <span
                      className={`badge ${w.priority === "URGENT" ? "badge-danger" : w.priority === "PRIORITY" ? "badge-warning" : "badge-gray"}`}
                      style={{ fontSize: 10 }}
                    >
                      {w.priority}
                    </span>
                    <span
                      className={`badge ${w.status === "DONE" ? "badge-success" : w.status === "IN_CONSULTATION" ? "badge-primary" : "badge-warning"}`}
                      style={{ fontSize: 10 }}
                    >
                      {w.status?.replace("_", " ")}
                    </span>
                    {w.status === "IN_CONSULTATION" && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleDone(w.walkin_id)}
                        style={{ fontSize: 11, padding: "4px 8px" }}
                      >
                        Done
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkInRegister;
