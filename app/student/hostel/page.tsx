"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Bed,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  Users,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useStudent } from "@/providers/StudentProvider";
import {
  Hostel,
  HostelAllocation,
  HostelApplication,
  HostelMaintenance,
  applyForHostel,
  getHostelsAvailable,
  getMyHostelAllocation,
  getMyHostelApplications,
  reportHostelMaintenance,
} from "@/services/hostel";
import styles from "./hostel.module.css";

export default function StudentHostelPage() {
  const { student } = useStudent();

  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [allocation, setAllocation] = useState<HostelAllocation | null>(null);
  const [applications, setApplications] = useState<HostelApplication[]>([]);

  // Apply form state
  const [selectedHostel, setSelectedHostel] = useState<number | "">("");
  const [roomType, setRoomType] = useState("4_bed");
  const [specialReqs, setSpecialReqs] = useState("");
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appMessage, setAppMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Maintenance form state
  const [issueType, setIssueType] = useState("plumbing");
  const [issueDesc, setIssueDesc] = useState("");
  const [submittingMaint, setSubmittingMaint] = useState(false);
  const [maintMessage, setMaintMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showMaintModal, setShowMaintModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hList, alloc, apps] = await Promise.all([
        getHostelsAvailable().catch(() => []),
        getMyHostelAllocation().catch(() => null),
        getMyHostelApplications().catch(() => []),
      ]);
      setHostels(hList);
      setAllocation(alloc);
      setApplications(apps);
      if (hList.length > 0 && !selectedHostel) {
        setSelectedHostel(hList[0].id);
      }
    } catch (err) {
      console.error("Failed to load hostel data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingApp(true);
    setAppMessage(null);
    try {
      await applyForHostel({
        preferred_hostel_id: selectedHostel ? Number(selectedHostel) : undefined,
        preferred_room_type: roomType,
        special_requirements: specialReqs,
      });
      setAppMessage({
        type: "success",
        text: "Your hostel accommodation application has been submitted successfully!",
      });
      setSpecialReqs("");
      await loadData();
    } catch (err: any) {
      setAppMessage({
        type: "error",
        text: err?.message || err?.detail || "Failed to submit hostel application.",
      });
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleReportMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDesc.trim()) return;
    setSubmittingMaint(true);
    setMaintMessage(null);
    try {
      await reportHostelMaintenance({
        issue_type: issueType,
        description: issueDesc,
      });
      setMaintMessage({
        type: "success",
        text: "Maintenance report submitted! Facilities team has been notified.",
      });
      setIssueDesc("");
      setTimeout(() => setShowMaintModal(false), 2000);
    } catch (err: any) {
      setMaintMessage({
        type: "error",
        text: err?.message || err?.detail || "Failed to submit maintenance report.",
      });
    } finally {
      setSubmittingMaint(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={36} />
        <p>Loading hostel accommodation portal...</p>
      </div>
    );
  }

  const latestApp = applications[0];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.pill}>Campus Life</span>
            <span className={styles.sessionPill}>Academic Session 2026/2027</span>
          </div>
          <h1 className={styles.title}>Hostel & Accommodation</h1>
          <p className={styles.subtitle}>
            On-campus residential booking, room allocation status, and facility maintenance.
          </p>
        </div>
        <button onClick={loadData} className={styles.refreshBtn} title="Refresh details">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 1. Active Allocation Card */}
      {allocation && allocation.allocated ? (
        <div className={styles.allocationBanner}>
          <div className={styles.allocHeader}>
            <div className={styles.allocIcon}>
              <CheckCircle2 size={28} className={styles.successIcon} />
            </div>
            <div>
              <span className={styles.allocBadge}>Allocated & Confirmed</span>
              <h2 className={styles.hallTitle}>{allocation.hostel_name}</h2>
              <p className={styles.hallSub}>
                {allocation.block_name} • Room {allocation.room_number} • {allocation.bed_number}
              </p>
            </div>
            <button
              onClick={() => setShowMaintModal(true)}
              className={styles.reportIssueBtn}
            >
              <Wrench size={16} />
              <span>Report Issue</span>
            </button>
          </div>

          <div className={styles.allocDetailsGrid}>
            <div className={styles.allocMetaBox}>
              <span className={styles.metaLabel}>Room Configuration</span>
              <span className={styles.metaVal}>{allocation.room_type?.replace("_", " ").toUpperCase() || "Standard"}</span>
            </div>
            <div className={styles.allocMetaBox}>
              <span className={styles.metaLabel}>Floor</span>
              <span className={styles.metaVal}>Floor {allocation.floor ?? 1}</span>
            </div>
            <div className={styles.allocMetaBox}>
              <span className={styles.metaLabel}>Hall Type</span>
              <span className={styles.metaVal}>{allocation.gender?.toUpperCase()} RESIDENCE</span>
            </div>
            <div className={styles.allocMetaBox}>
              <span className={styles.metaLabel}>Confirmation Date</span>
              <span className={styles.metaVal}>
                {allocation.allocated_at ? new Date(allocation.allocated_at).toLocaleDateString() : "Active"}
              </span>
            </div>
          </div>

          {/* Roommates */}
          {allocation.roommates && allocation.roommates.length > 0 && (
            <div className={styles.roommatesSection}>
              <div className={styles.roommatesTitle}>
                <Users size={16} />
                <span>Assigned Roommates ({allocation.roommates.length})</span>
              </div>
              <div className={styles.roommatesGrid}>
                {allocation.roommates.map((r, i) => (
                  <div key={i} className={styles.roommateCard}>
                    <div className={styles.roommateAvatar}>
                      {r.name.charAt(0)}
                    </div>
                    <div className={styles.roommateInfo}>
                      <span className={styles.roommateName}>{r.name}</span>
                      <span className={styles.roommateSub}>
                        {r.matric_number} • {r.bed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : latestApp && latestApp.status === "pending" ? (
        <div className={styles.pendingCard}>
          <div className={styles.pendingIcon}>
            <Clock size={24} />
          </div>
          <div>
            <h3 className={styles.pendingTitle}>Hostel Application Under Review</h3>
            <p className={styles.pendingText}>
              Your request for <strong>{latestApp.preferred_hostel_name || "Campus Hostel"}</strong> ({latestApp.preferred_room_type.replace("_", " ")}) has been queued. The Hall Administrator will match and allocate your bed space shortly.
            </p>
            <span className={styles.dateSubmitted}>
              Submitted on {new Date(latestApp.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : null}

      {/* 2. Application Form (Show if not allocated) */}
      {(!allocation || !allocation.allocated) && (!latestApp || latestApp.status !== "pending") && (
        <div className={styles.formCard}>
          <div className={styles.formCardHeader}>
            <Building2 size={22} className={styles.primaryIcon} />
            <div>
              <h2 className={styles.sectionTitle}>Apply for Hostel Space</h2>
              <p className={styles.sectionSub}>
                Select your preferred residential hall and bed space configuration for the current semester.
              </p>
            </div>
          </div>

          {appMessage && (
            <div
              className={
                appMessage.type === "success"
                  ? styles.alertSuccess
                  : styles.alertError
              }
            >
              {appMessage.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{appMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleApply} className={styles.applyForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Preferred Residential Hall</label>
                <select
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(Number(e.target.value))}
                  className={styles.select}
                  required
                >
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.gender_display} • Capacity: {h.capacity})
                    </option>
                  ))}
                  {hostels.length === 0 && (
                    <option value="">St. Joseph Hall (Male Residence)</option>
                  )}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Room Configuration</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="1_bed">1-Bed Private Suite</option>
                  <option value="2_bed">2-Bed Shared Room</option>
                  <option value="4_bed">4-Bed Standard Quad (Recommended)</option>
                  <option value="6_bed">6-Bed Room</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Medical or Special Accommodation Preferences (Optional)
              </label>
              <textarea
                value={specialReqs}
                onChange={(e) => setSpecialReqs(e.target.value)}
                placeholder="e.g. Lower bunk required due to medical reason, quiet study floor, etc."
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.formFooter}>
              <div className={styles.policyNotice}>
                <ShieldCheck size={16} />
                <span>Hostel spaces are allocated on institutional guidelines and verified student status.</span>
              </div>
              <button
                type="submit"
                disabled={submittingApp}
                className={styles.submitBtn}
              >
                {submittingApp ? (
                  <>
                    <Loader2 size={16} className={styles.btnSpinner} />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Accommodation Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Halls Overview Cards */}
      <div className={styles.hallsSection}>
        <h3 className={styles.hallsTitle}>Campus Residential Halls</h3>
        <div className={styles.hallsGrid}>
          {hostels.map((h) => (
            <div key={h.id} className={styles.hallCard}>
              <div className={styles.hallCardTop}>
                <span className={styles.hallIconBox}>
                  <Building2 size={20} />
                </span>
                <span className={styles.hallGenderTag}>
                  {h.gender?.toUpperCase()}
                </span>
              </div>
              <h4 className={styles.hallCardName}>{h.name}</h4>
              <p className={styles.hallCardDesc}>
                {h.description || "Fully serviced on-campus residential facility with 24/7 security and utilities."}
              </p>
              <div className={styles.hallCardFooter}>
                <span>Capacity: {h.capacity} Beds</span>
                <span className={styles.campusTag}>{h.campus || "Main Campus"}</span>
              </div>
            </div>
          ))}
          {hostels.length === 0 && (
            <div className={styles.hallCard}>
              <div className={styles.hallCardTop}>
                <span className={styles.hallIconBox}>
                  <Building2 size={20} />
                </span>
                <span className={styles.hallGenderTag}>MALE</span>
              </div>
              <h4 className={styles.hallCardName}>St. Joseph Hall</h4>
              <p className={styles.hallCardDesc}>
                Main campus male residential quad with reading halls and recreation area.
              </p>
              <div className={styles.hallCardFooter}>
                <span>Capacity: 240 Beds</span>
                <span className={styles.campusTag}>Main Campus</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Maintenance Report Modal */}
      {showMaintModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMaintModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <Wrench size={22} className={styles.primaryIcon} />
              <div>
                <h3 className={styles.modalTitle}>Report Room Maintenance</h3>
                <p className={styles.modalSub}>
                  Log a repair ticket for room {allocation?.room_number || "current room"}.
                </p>
              </div>
            </div>

            {maintMessage && (
              <div
                className={
                  maintMessage.type === "success"
                    ? styles.alertSuccess
                    : styles.alertError
                }
              >
                {maintMessage.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{maintMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleReportMaintenance}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Issue Category</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="plumbing">Plumbing (Leakage, Tap, Toilet)</option>
                  <option value="electrical">Electrical (Sockets, Lighting, Fan)</option>
                  <option value="furniture">Furniture (Bed frame, Desk, Wardrobe)</option>
                  <option value="damage">Window / Door / Structural</option>
                  <option value="other">Other Facility Issue</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Describe the Problem</label>
                <textarea
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Please describe the issue in detail so technicians can bring appropriate tools..."
                  className={styles.textarea}
                  rows={4}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMaint}
                  className={styles.submitBtn}
                >
                  {submittingMaint ? (
                    <Loader2 size={16} className={styles.btnSpinner} />
                  ) : (
                    <Send size={16} />
                  )}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
