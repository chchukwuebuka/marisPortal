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
  Check,
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
  const [selectedHostel, setSelectedHostel] = useState<number | null>(null);
  const [roomType, setRoomType] = useState("four_bed");
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
      if (hList.length > 0 && selectedHostel === null) {
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
    if (!selectedHostel) {
      setAppMessage({
        type: "error",
        text: "Please select your preferred residential hall from the choices above.",
      });
      return;
    }

    setSubmittingApp(true);
    setAppMessage(null);
    try {
      await applyForHostel({
        preferred_hostel_id: selectedHostel,
        preferred_room_type: roomType,
        special_requirements: specialReqs,
      });
      setAppMessage({
        type: "success",
        text: "Your hostel accommodation application has been submitted successfully! The student affairs team will match and allocate your bed space.",
      });
      setSpecialReqs("");
      await loadData();
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.detail ||
        (typeof err === "string" ? err : "Failed to submit hostel application. Please verify your student status.");
      setAppMessage({
        type: "error",
        text: errorMsg,
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
  const chosenHostelObj = hostels.find((h) => h.id === selectedHostel);

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
            Explore institutional residential halls, choose your accommodation space, and track bed allocation.
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
            <h3 className={styles.pendingTitle}>Hostel Accommodation Request Under Review</h3>
            <p className={styles.pendingText}>
              Your request for <strong>{latestApp.preferred_hostel_name || "Campus Residential Hall"}</strong> (
              {latestApp.preferred_room_type.replace("_", " ").toUpperCase()}) has been received and queued. The Hall Administrator will review and allocate your bed space shortly.
            </p>
            <span className={styles.dateSubmitted}>
              Submitted on {new Date(latestApp.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : null}

      {/* 2. Interactive Hostel Selection & Application Form (Show if not allocated and not pending) */}
      {(!allocation || !allocation.allocated) && (!latestApp || latestApp.status !== "pending") && (
        <div className={styles.formCard}>
          <div className={styles.formCardHeader}>
            <Building2 size={24} className={styles.primaryIcon} />
            <div>
              <h2 className={styles.sectionTitle}>Apply for Hostel Space</h2>
              <p className={styles.sectionSub}>
                Browse the on-campus residential halls created by the institution, click on your preferred hall to choose it, and submit your accommodation request.
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
            {/* Step 1: Interactive Hall Selection */}
            <div className={styles.chooseHallSection}>
              <div className={styles.chooseHallHeader}>
                <h3 className={styles.chooseHallTitle}>
                  1. Choose Your Preferred Residential Hall
                </h3>
                <p className={styles.chooseHallSub}>
                  Click on any residential hall card to select it for your accommodation.
                </p>
              </div>

              {hostels.length === 0 ? (
                <div className={styles.emptyHallsState}>
                  <Building2 size={32} style={{ margin: "0 auto 8px", color: "#94a3b8" }} />
                  <p style={{ fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>
                    No Residential Halls Currently Configured
                  </p>
                  <p style={{ margin: 0 }}>
                    Please check back shortly or contact the Student Affairs and Accommodation registry.
                  </p>
                </div>
              ) : (
                <div className={styles.hallsSelectionGrid}>
                  {hostels.map((h) => {
                    const isSelected = selectedHostel === h.id;
                    const genderClass =
                      h.gender === "female"
                        ? styles.genderFemale
                        : h.gender === "male"
                        ? styles.genderMale
                        : styles.genderMixed;

                    const totalBeds = h.total_beds ?? h.capacity ?? 0;
                    const availableBeds = h.available_beds ?? totalBeds;
                    const feeVal = Number(h.fee_per_session || 45000);

                    return (
                      <div
                        key={h.id}
                        onClick={() => setSelectedHostel(h.id)}
                        className={`${styles.hallCardInteractive} ${
                          isSelected ? styles.hallCardSelected : ""
                        }`}
                      >
                        {isSelected && (
                          <div className={styles.hallSelectedIndicator}>
                            <Check size={12} strokeWidth={3} />
                            <span>Selected</span>
                          </div>
                        )}

                        <div className={styles.hallCardHeader}>
                          <span className={styles.hallIconBox}>
                            <Building2 size={20} />
                          </span>
                          <div className={styles.hallCardInfo}>
                            <h4 className={styles.hallCardTitle}>{h.name}</h4>
                            <span className={styles.hallCardCode}>{h.code}</span>
                          </div>
                        </div>

                        <span className={`${styles.hallGenderBadge} ${genderClass}`}>
                          {h.gender === "female"
                            ? "FEMALE ONLY (LADIES)"
                            : h.gender === "male"
                            ? "MALE ONLY (GENTLEMEN)"
                            : "CO-ED / MIXED RESIDENCE"}
                        </span>

                        <p className={styles.hallCardDesc}>
                          {h.description ||
                            "Serviced campus residential hall equipped with electricity, water supply, and study facilities."}
                        </p>

                        <div className={styles.hallBedStats}>
                          <div className={styles.bedStatItem}>
                            <span className={styles.bedStatLabel}>Bed Spaces</span>
                            <span className={styles.bedStatVal}>
                              {availableBeds > 0 ? `${availableBeds} Available` : "Check Availability"}
                            </span>
                          </div>
                          <div className={styles.bedStatItem} style={{ textAlign: "right" }}>
                            <span className={styles.bedStatLabel}>Session Fee</span>
                            <span className={styles.hallFeeBadge}>
                              ₦{feeVal.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {h.warden_name && (
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            <strong>Warden:</strong> {h.warden_name}{" "}
                            {h.warden_phone ? `(${h.warden_phone})` : ""}
                          </div>
                        )}

                        <button
                          type="button"
                          className={
                            isSelected
                              ? styles.chooseHallBtnSelected
                              : styles.chooseHallBtnDefault
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHostel(h.id);
                          }}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 size={15} />
                              <span>Selected Hall</span>
                            </>
                          ) : (
                            <span>Choose This Hall</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Room Configuration & Preferences */}
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.chooseHallHeader}>
                <h3 className={styles.chooseHallTitle}>
                  2. Room Configuration & Preferences
                </h3>
                <p className={styles.chooseHallSub}>
                  {chosenHostelObj
                    ? `Configuring accommodation request for "${chosenHostelObj.name}"`
                    : "Select your preferred room type and any special accommodation needs."}
                </p>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Selected Residential Hall</label>
                  <select
                    value={selectedHostel || ""}
                    onChange={(e) => setSelectedHostel(Number(e.target.value))}
                    className={styles.select}
                    required
                  >
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.gender_display} • ₦{Number(h.fee_per_session || 45000).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Preferred Room Configuration</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className={styles.select}
                    required
                  >
                    <option value="four_bed">4-Bed Standard Quad Room (Recommended)</option>
                    <option value="double">2-Bed Shared Room</option>
                    <option value="single">1-Bed Single Private Suite</option>
                    <option value="executive">Executive En-Suite Room</option>
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
                  placeholder="e.g. Lower bunk required due to medical condition, allergy, or special study needs."
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.formFooter}>
                <div className={styles.policyNotice}>
                  <ShieldCheck size={16} />
                  <span>
                    Hostel spaces are allocated in accordance with Marist Polytechnic residential guidelines and verified active student status.
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submittingApp || !selectedHostel}
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
            </div>
          </form>
        </div>
      )}

      {/* 3. Campus Residential Halls Directory (Always visible for exploring) */}
      <div className={styles.hallsSection}>
        <h3 className={styles.hallsTitle}>Campus Residential Halls Directory</h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "-8px 0 16px" }}>
          Official institutional hall listing and residential facilities available on campus.
        </p>
        <div className={styles.hallsGrid}>
          {hostels.map((h) => {
            const genderClass =
              h.gender === "female"
                ? styles.genderFemale
                : h.gender === "male"
                ? styles.genderMale
                : styles.genderMixed;
            const totalBeds = h.total_beds ?? h.capacity ?? 0;
            const feeVal = Number(h.fee_per_session || 45000);

            return (
              <div key={h.id} className={styles.hallCard}>
                <div className={styles.hallCardTop}>
                  <span className={styles.hallIconBox}>
                    <Building2 size={20} />
                  </span>
                  <span className={`${styles.hallGenderBadge} ${genderClass}`}>
                    {h.gender?.toUpperCase()}
                  </span>
                </div>
                <h4 className={styles.hallCardName}>{h.name}</h4>
                <code style={{ fontSize: "11px", color: "#64748b" }}>{h.code}</code>
                <p className={styles.hallCardDesc}>
                  {h.description || "Serviced on-campus residential facility with 24/7 security and utilities."}
                </p>
                <div className={styles.hallCardFooter}>
                  <span>Capacity: {totalBeds > 0 ? `${totalBeds} Beds` : "Standard"}</span>
                  <span className={styles.campusTag}>₦{feeVal.toLocaleString()} / Sem</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Maintenance Report Modal */}
      {showMaintModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Report Facility Issue</h3>
              <button onClick={() => setShowMaintModal(false)} className={styles.modalClose}>
                &times;
              </button>
            </div>

            {maintMessage && (
              <div
                className={
                  maintMessage.type === "success"
                    ? styles.alertSuccess
                    : styles.alertError
                }
              >
                <span>{maintMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleReportMaintenance} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Issue Category</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className={styles.select}
                >
                  <option value="plumbing">Plumbing (Water, Pipes, Washroom)</option>
                  <option value="electrical">Electrical (Light, Socket, Switch)</option>
                  <option value="furniture">Furniture (Bed frame, Wardrobe, Desk)</option>
                  <option value="damage">Structural (Door lock, Window, Wall)</option>
                  <option value="other">Other Facility Request</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Issue Details & Location in Room</label>
                <textarea
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Describe the issue in detail so maintenance technicians can locate and repair it..."
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
                  disabled={submittingMaint || !issueDesc.trim()}
                  className={styles.submitBtn}
                >
                  {submittingMaint ? "Submitting..." : "Send Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
