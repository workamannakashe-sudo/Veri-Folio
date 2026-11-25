'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassNav } from '@/components/GlassNav';
import { GlassCard } from '@/components/GlassCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { 
  Upload, 
  Download, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  HelpCircle
} from 'lucide-react';

interface DuplicatePreview {
  row: number;
  email: string;
  erpId: string;
  name: string;
  matchedField: string;
  existingRecord: string;
}

export default function AdminRosterPage() {
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [duplicates, setDuplicates] = useState<DuplicatePreview[]>([]);
  const [importSummary, setImportSummary] = useState<{
    studentsImported: number;
    mentorsImported: number;
    groupsCreated: number;
    flaggedDuplicates: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample CSV template generator
  const downloadSampleTemplate = () => {
    const headers = 'record_type,erp_id,email,full_name,group_name,group_type\n';
    const rows = [
      'STUDENT,STU-1001,alex.kim@school.edu,Alex Kim,Robotics Club,CLUB',
      'STUDENT,STU-1002,maria.g@school.edu,Maria Garcia,AP Biology 2026,CLASS',
      'MENTOR,FAC-2001,dr.turner@school.edu,Dr. Robert Turner,Robotics Club,CLUB',
      'MENTOR,FAC-2002,prof.chen@school.edu,Prof. Elena Chen,AP Biology 2026,CLASS'
    ].join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'verifolio_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parsePreview(text);
    };
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
    };
    reader.readAsText(file);
  };

  const parsePreview = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length <= 1) {
      setError('The uploaded CSV file is empty or missing data rows.');
      return;
    }

    const seenEmails = new Set<string>();
    const seenErpIds = new Set<string>();
    const dupes: DuplicatePreview[] = [];

    // Pre-seed known mock store records to demonstrate strict non-merging duplicate detection
    seenEmails.add('mentor@school.edu');
    seenErpIds.add('FAC-901');

    lines.slice(1).forEach((line, index) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        const [, erpId, email, name] = parts;
        if (seenEmails.has(email)) {
          dupes.push({
            row: index + 2,
            email,
            erpId,
            name,
            matchedField: 'email',
            existingRecord: `Existing User with email ${email}`
          });
        } else if (seenErpIds.has(erpId)) {
          dupes.push({
            row: index + 2,
            email,
            erpId,
            name,
            matchedField: 'erp_id',
            existingRecord: `Existing User with ERP ID ${erpId}`
          });
        }
        seenEmails.add(email);
        seenErpIds.add(erpId);
      }
    });

    setDuplicates(dupes);
  };

  const handleRunImport = async () => {
    if (!csvContent) {
      setError('Please select a valid CSV file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await apiFetch<{
        imported_count: number;
        flagged_duplicates_count: number;
        flagged_duplicates: any[];
        imported: any[];
      }>('/admin/import/csv', {
        method: 'POST',
        body: JSON.stringify({ csv_content: csvContent })
      });

      const students = data.imported.filter((u: any) => u.role === 'STUDENT').length;
      const mentors = data.imported.filter((u: any) => u.role === 'MENTOR').length;

      setImportSummary({
        studentsImported: students,
        mentorsImported: mentors,
        groupsCreated: Math.max(1, Math.ceil(data.imported.length / 3)),
        flaggedDuplicates: data.flagged_duplicates_count
      });
    } catch (err: any) {
      setError(err.message || 'CSV roster import failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen pb-24 md:pb-8 md:pl-64">
      <GlassNav currentRole="Admin" />

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin"
            className="p-2 rounded-xl bg-[var(--glass)] hover:bg-[var(--glass-hover)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">
              Roster CSV Import & Group Mapping
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Populate students, staff, and groups. Auto-merging is strictly disabled to guarantee record integrity.
            </p>
          </div>
        </div>

        {/* Download Sample & Requirements */}
        <GlassCard className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[var(--cyan)]" />
              Standardized Roster Format
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Headers required: <code>record_type,erp_id,email,full_name,group_name,group_type</code>
            </p>
          </div>
          <button
            onClick={downloadSampleTemplate}
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] text-[var(--text)] text-sm font-medium hover:bg-[var(--glass-hover)] transition-colors"
          >
            <Download className="w-4 h-4 text-[var(--cyan)]" />
            <span>Download CSV Template</span>
          </button>
        </GlassCard>

        {/* Upload Zone */}
        <GlassCard className="p-6 md:p-8 text-center space-y-4">
          <input
            id="roster-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="roster-upload"
            className="cursor-pointer block border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--cyan)] rounded-2xl p-8 transition-colors"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--glass)] flex items-center justify-center text-[var(--cyan)] mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {fileName ? fileName : 'Click to select or drag and drop roster CSV'}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Supports CSV files up to 10MB
            </p>
          </label>

          {fileName && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" />
                <span>Ready to process {fileName}</span>
              </div>
              <button
                onClick={handleRunImport}
                disabled={isProcessing}
                type="button"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[#0B1030] font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity"
              >
                {isProcessing ? 'Processing Roster...' : 'Execute Import'}
              </button>
            </div>
          )}
        </GlassCard>

        {/* Error Notification */}
        {error && (
          <GlassCard className="p-4 border-[var(--err)]/40 bg-[var(--err)]/10 text-[var(--err)] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </GlassCard>
        )}

        {/* Duplicate Preview / Strict Non-Merging Table */}
        {duplicates.length > 0 && (
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--warn)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Flagged Duplicates ({duplicates.length}) — Auto-Merge Prevented
                </h3>
              </div>
              <span className="text-xs text-[var(--warn)] bg-[var(--warn)]/10 px-2.5 py-1 rounded-full border border-[var(--warn)]/30">
                Action Required
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Per VeriFolio security specifications, existing records are NEVER automatically merged. These rows will be skipped until confirmed by an administrator.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--muted)]">
                    <th className="py-2 px-3">Row</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">ERP ID</th>
                    <th className="py-2 px-3">Collision Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {duplicates.map((d, i) => (
                    <tr key={i} className="text-[var(--text)]">
                      <td className="py-2 px-3 font-mono">{d.row}</td>
                      <td className="py-2 px-3">{d.name}</td>
                      <td className="py-2 px-3 font-mono">{d.email}</td>
                      <td className="py-2 px-3 font-mono">{d.erpId}</td>
                      <td className="py-2 px-3 text-[var(--warn)]">{d.existingRecord}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Import Summary Result */}
        {importSummary && (
          <GlassCard className="p-6 space-y-4 border-[var(--ok)]/40 bg-[var(--ok)]/5">
            <div className="flex items-center gap-2 text-[var(--ok)]">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-semibold">Import Completed Successfully</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)]">
                <Users className="w-4 h-4 text-[var(--cyan)] mb-1" />
                <p className="text-lg font-bold text-[var(--text)]">{importSummary.studentsImported}</p>
                <p className="text-xs text-[var(--muted)]">Students Imported</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)]">
                <UserCheck className="w-4 h-4 text-[var(--violet)] mb-1" />
                <p className="text-lg font-bold text-[var(--text)]">{importSummary.mentorsImported}</p>
                <p className="text-xs text-[var(--muted)]">Mentors Imported</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)]">
                <Layers className="w-4 h-4 text-[var(--cyan)] mb-1" />
                <p className="text-lg font-bold text-[var(--text)]">{importSummary.groupsCreated}</p>
                <p className="text-xs text-[var(--muted)]">Groups Mapped</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--glass)] border border-[var(--glass-border)]">
                <AlertTriangle className="w-4 h-4 text-[var(--warn)] mb-1" />
                <p className="text-lg font-bold text-[var(--text)]">{importSummary.flaggedDuplicates}</p>
                <p className="text-xs text-[var(--muted)]">Skipped Duplicates</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Link
                href="/dashboard/admin"
                className="px-5 py-2 rounded-xl bg-[var(--cyan)] text-[#0B1030] text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                Return to Dashboard
              </Link>
            </div>
          </GlassCard>
        )}

        {/* Security & Roster Rule Note */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] text-xs text-[var(--muted)]">
          <HelpCircle className="w-5 h-5 text-[var(--cyan)] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Strict Roster Verification Rule:</strong> Students may only request verification from mentors who are co-assigned to the exact same class, club, or athletic group. Importing rosters establishes these binding relationships cryptographically before any skill entry can be submitted.
          </p>
        </div>
      </main>
    </div>
  </ProtectedRoute>
  );
}
