"use client";

import { useState } from "react";
import { CheckCircle2, Phone, Plus, Trash2, User, Users } from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Field, Input, Select, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";

export default function StudentGuardiansPage() {
  const { guardians, addGuardian, removeGuardian, loading } = useStudent();
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Father");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg("Guardian name and phone number are required.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addGuardian({
        name,
        relationship,
        phone,
        email: email || undefined,
        address: address || undefined,
        isPrimary,
      });
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setIsPrimary(false);
      setShowAdd(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add guardian.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Student Portal"
        title="Guardians & Next-of-Kin"
        description="Manage official emergency contacts, parents, and sponsors registered on your student record."
        actions={
          <Button
            variant="primary"
            onClick={() => setShowAdd(!showAdd)}
            leftIcon={<Plus size={16} />}
          >
            {showAdd ? "Cancel" : "Add Guardian"}
          </Button>
        }
      />

      {errorMsg && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert tone="error" title="Error">
            {errorMsg}
          </Alert>
        </div>
      )}

      {showAdd && (
        <Card style={{ marginBottom: "2rem" }}>
          <CardHeader title="Register New Guardian or Sponsor" subtitle="Provide verified contact information." />
          <CardBody>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Full Name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chief John Okafor" required />
                </Field>
                <Field label="Relationship" required>
                  <Select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sponsor">Sponsor</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Spouse">Spouse</option>
                  </Select>
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Phone Number" required>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080xxxxxxxx" required />
                </Field>
                <Field label="Email Address">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
                </Field>
              </div>

              <Field label="Residential Address">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address, city" />
              </Field>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="primaryGuardian"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                />
                <label htmlFor="primaryGuardian" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                  Designate as Primary Contact & Sponsor
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <Button variant="primary" type="submit" loading={isSubmitting}>
                  Save Guardian
                </Button>
                <Button variant="outline" type="button" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {guardians.length === 0 ? (
        <Card>
          <CardBody>
            <div style={{ textAlign: "center", padding: "2.5rem" }}>
              <Users size={40} style={{ color: "var(--color-muted)", marginBottom: "0.75rem" }} />
              <p style={{ fontWeight: 600 }}>No Guardians Registered</p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginBottom: "1rem" }}>
                Click &quot;Add Guardian&quot; above to register your parent, sponsor, or next-of-kin.
              </p>
              <Button variant="primary" onClick={() => setShowAdd(true)} leftIcon={<Plus size={16} />}>
                Add Guardian
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {guardians.map((g) => (
            <Card key={g.id}>
              <CardBody>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-ink)" }}>{g.name}</h4>
                      {g.isPrimary && <Badge tone="success">Primary</Badge>}
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-primary)", fontWeight: 600 }}>
                      {g.relationship}
                    </span>
                  </div>

                  {!g.isPrimary && (
                    <button
                      type="button"
                      onClick={() => removeGuardian(g.id)}
                      style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", padding: "0.25rem" }}
                      title="Remove guardian"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem", color: "var(--color-ink-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Phone size={15} style={{ color: "var(--color-muted)" }} />
                    <span>{g.phone}</span>
                  </div>
                  {g.email && (
                    <div style={{ color: "var(--color-muted)" }}>
                      <span>Email: {g.email}</span>
                    </div>
                  )}
                  {g.address && (
                    <div style={{ color: "var(--color-muted)" }}>
                      <span>Address: {g.address}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
