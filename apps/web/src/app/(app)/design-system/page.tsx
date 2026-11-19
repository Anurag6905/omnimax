"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Lifeline } from "@/components/clients/lifeline";
import { SAMPLE_MEMBERS } from "@/lib/sample-data";

const COLOURS = [
  { name: "Ink", hex: "#14213D", use: "Headings and main text", cls: "bg-ink" },
  { name: "Ink soft", hex: "#2F3B55", use: "Body text in tables", cls: "bg-ink-soft" },
  { name: "Muted", hex: "#5B6475", use: "Secondary text, hints", cls: "bg-muted" },
  { name: "Line", hex: "#E6E8EE", use: "Borders and dividers", cls: "bg-line" },
  { name: "Surface", hex: "#F7F8FA", use: "Table headers, hover", cls: "bg-surface" },
  { name: "Ledger green", hex: "#0F6B5C", use: "Main actions, active items, retirement", cls: "bg-brand" },
  { name: "Green tint", hex: "#E8F3F0", use: "Selected states", cls: "bg-brand-50" },
  { name: "Amber", hex: "#A86A12", use: "Needs attention, prospects", cls: "bg-warn" },
  { name: "Red", hex: "#B42318", use: "Errors, removing things", cls: "bg-danger" },
];

const TYPE = [
  { label: "Page title", cls: "text-[22px] font-semibold tracking-[-0.01em]", spec: "22 / 600" },
  { label: "Section title", cls: "text-[15px] font-semibold", spec: "15 / 600" },
  { label: "Body and tables", cls: "text-sm", spec: "14 / 400" },
  { label: "Labels", cls: "text-[13px] font-medium", spec: "13 / 500" },
  { label: "Hints and captions", cls: "text-xs text-muted", spec: "12 / 400" },
  { label: "Figures: ₹ 1,24,50,000", cls: "text-xl font-semibold", spec: "20 / 600, even-width digits" },
];

export default function DesignSystemPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        title="Design system"
        description="Colours, type and parts used across the app. Reviewers can check new screens against this page."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Colour">
          <ul className="divide-y divide-line">
            {COLOURS.map((c) => (
              <li key={c.name} className="flex items-center gap-4 px-5 py-2.5">
                <span className={`size-8 shrink-0 rounded-md ring-1 ring-black/5 ${c.cls}`} />
                <span className="w-32 text-[13px] font-medium text-ink">{c.name}</span>
                <span className="w-20 text-xs text-muted">{c.hex}</span>
                <span className="text-xs text-ink-soft">{c.use}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Type: IBM Plex Sans">
          <ul className="divide-y divide-line">
            {TYPE.map((t) => (
              <li key={t.label} className="flex items-baseline justify-between gap-4 px-5 py-3">
                <span className={`text-ink ${t.cls}`}>{t.label}</span>
                <span className="shrink-0 text-xs text-faint">{t.spec}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Buttons and badges">
          <div className="flex flex-col gap-5 px-5 py-5">
            <div className="flex flex-wrap gap-2">
              <Button><Plus size={16} /> Add client</Button>
              <Button variant="secondary">Cancel</Button>
              <Button variant="ghost">Clear filters</Button>
              <Button variant="danger">Remove member</Button>
              <Button disabled>Saving</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small primary</Button>
              <Button size="sm" variant="secondary">Small secondary</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">Active</Badge>
              <Badge tone="warn">Prospect</Badge>
              <Badge tone="outline">Inactive</Badge>
              <Badge tone="danger">Underfunded</Badge>
              <Badge>Neutral</Badge>
              <span className="ml-2 flex -space-x-1.5">
                {["Rahul Sharma", "Neha Sharma", "Aarav Sharma"].map((n) => <Avatar key={n} name={n} className="ring-2 ring-white" />)}
              </span>
            </div>
            <p className="text-xs text-muted">One main action per screen. Button text says what happens: &quot;Add client&quot;, not &quot;Submit&quot;.</p>
          </div>
        </Panel>

        <Panel title="Form fields">
          <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            <Field label="Full name" required>{(id) => <Input id={id} defaultValue="Rahul Sharma" />}</Field>
            <Field label="Residence status">
              {(id) => <Select id={id} defaultValue="Resident Indian"><option>Resident Indian</option><option>NRI</option></Select>}
            </Field>
            <Field label="Life expectancy" hint="85 unless the client says otherwise">{(id, d) => <Input id={id} aria-describedby={d} defaultValue="85" />}</Field>
            <Field label="PAN" error="PAN has 10 characters, like ABCDE1234F.">{(id, d) => <Input id={id} aria-describedby={d} aria-invalid defaultValue="ABCD123" />}</Field>
            <div className="sm:col-span-2">
              <Button variant="secondary" onClick={() => setOpen(true)}>Open a sample dialog</Button>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Household life line" className="mt-6">
        <div className="px-5 py-4">
          <Lifeline members={SAMPLE_MEMBERS.filter((m) => m.clientId === "c-1")} />
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          The one stand-out element. Every family member on the same 0–100 age scale, so the gaps between retirements and the length of the plan are visible at a glance.
        </p>
      </Panel>

      <Panel title="Layout rules" className="mt-6">
        <ul className="list-disc space-y-1.5 px-10 py-4 text-sm text-ink-soft">
          <li>White pages. Sidebar 240 px; content up to 1240 px wide, left aligned.</li>
          <li>Borders, not shadows, separate content. Shadows only on menus and dialogs that float.</li>
          <li>Numbers are right aligned in tables; dates use the sheet&apos;s format, 12-Apr-1985.</li>
          <li>Labels in sentence case. Errors say what to fix.</li>
          <li>Everything works by keyboard, with a visible green focus ring.</li>
        </ul>
      </Panel>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Sample dialog"
        description="Used for adding and editing records."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Save changes</Button></>}
      >
        <Field label="Household name">{(id) => <Input id={id} defaultValue="Sharma family" />}</Field>
      </Dialog>
    </>
  );
}
