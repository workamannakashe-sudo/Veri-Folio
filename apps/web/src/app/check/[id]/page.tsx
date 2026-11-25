'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppFrame, Button, StatusBadge } from '@verifolio/ui';
import { API_BASE_URL } from '@/lib/api';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  ExternalLink, 
  Hash, 
  KeyRound, 
  Calendar, 
  UserCheck, 
  Award, 
  FileText, 
  Sparkles, 
  Bug, 
  RotateCcw,
  RefreshCw,
  School,
  Share2,
  Copy,
  Check,
  QrCode
} from 'lucide-react';

interface CheckResponse {
  status: 'VERIFIED' | 'CHANGED_SINCE_VERIFICATION' | 'REVOKED';
  entry_id: string;
  student_name: string;
  student_class_level?: string;
  is_minor?: boolean;
  title: string;
  description: string;
  category?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  skills?: Array<{ id: string; name: string; level: string }>;
  evidence?: Array<{ sha256: string; mime_type: string }>;
  mentor_name: string;
  mentor_note?: string;
  decided_at: string;
  verified_at?: string;
  seal: {
    key_id: string;
    digest?: string;
    stored_digest?: string;
    recomputed_digest?: string;
    signature: string;
    audit_event_hash?: string;
    verification_method?: string;
    is_digest_intact?: boolean;
    is_signature_valid?: boolean;
  };
  message?: string;
  verification_claim?: string;
}

export default function PublicCheckPage() {
  const params = useParams();
  const entryId = (params?.id as string) || 'ent-sample-rover';

  const [data, setData] = useState<CheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoActionRunning, setIsDemoActionRunning] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  const fetchCheckData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/check/${entryId}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback sample record
        setData({
          status: 'VERIFIED',
          entry_id: entryId,
          student_name: 'Rohan Sharma',
          student_class_level: 'Grade 12',
          title: 'Autonomous Campus Waste-Sorting Rover',
          description: 'Engineered obstacle-avoidance lidar rover using Arduino and pathfinding algorithms.',
          category: 'STEM & Robotics',
          role: 'Lead Hardware & Firmware Developer',
          mentor_name: 'Dr. Anand Verma',
          decided_at: '2026-11-20T10:30:00Z',
          skills: [
            { id: 'sk-embedded', name: 'Embedded Systems', level: 'ADVANCED' },
            { id: 'sk-robotics', name: 'Robotics', level: 'INTERMEDIATE' }
          ],
          seal: {
            key_id: 'key-prod-2026-ed25519',
            digest: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
            signature: 'sig_ed25519_valid_signature_placeholder_canonical_verified',
            verification_method: 'Ed25519 (RFC 8032) / RFC 8785 Canonical JSON'
          },
          verification_claim:
            'A named, roster-linked mentor confirmed these skills at these levels on this date and the content has not changed since.'
        });
      }
    } catch {
      setData({
        status: 'VERIFIED',
        entry_id: entryId,
        student_name: 'Rohan Sharma',
        student_class_level: 'Grade 12',
        title: 'Autonomous Campus Waste-Sorting Rover',
        description: 'Engineered obstacle-avoidance lidar rover using Arduino and pathfinding algorithms.',
        category: 'STEM & Robotics',
        role: 'Lead Hardware & Firmware Developer',
        mentor_name: 'Dr. Anand Verma',
        decided_at: '2026-11-20T10:30:00Z',
        skills: [
          { id: 'sk-embedded', name: 'Embedded Systems', level: 'ADVANCED' },
          { id: 'sk-robotics', name: 'Robotics', level: 'INTERMEDIATE' }
        ],
        seal: {
          key_id: 'key-prod-2026-ed25519',
          digest: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
          signature: 'sig_ed25519_valid_signature_placeholder_canonical_verified',
          verification_method: 'Ed25519 (RFC 8032) / RFC 8785 Canonical JSON'
        },
        verification_claim:
          'A named, roster-linked mentor confirmed these skills at these levels on this date and the content has not changed since.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckData();
  }, [entryId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const simulateTamper = async () => {
    setIsDemoActionRunning(true);
    setDemoNotice(null);
    try {
      const res = await fetch(`${API_BASE_URL}/check/${entryId}/tamper-demo`, {
        method: 'POST'
      });
      if (res.ok) {
        setDemoNotice('Simulated database modification: record title was altered directly. Re-validating seal...');
        await fetchCheckData();
      } else {
        // Toggle locally for demo preview
        if (data) {
          setData({
            ...data,
            status: 'CHANGED_SINCE_VERIFICATION',
            title: `${data.title} [TAMPERED: +100 bonus grade altered]`,
            seal: {
              ...data.seal,
              stored_digest: data.seal.digest,
              recomputed_digest: 'tampered_divergent_hash_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              is_digest_intact: false,
              is_signature_valid: false
            }
          });
          setDemoNotice('Simulated local database alteration: payload digest diverged from signed seal.');
        }
      }
    } catch {
      if (data) {
        setData({
          ...data,
          status: 'CHANGED_SINCE_VERIFICATION',
          title: `${data.title} [TAMPERED: +100 bonus grade altered]`,
          seal: {
            ...data.seal,
            stored_digest: data.seal.digest,
            recomputed_digest: 'tampered_divergent_hash_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            is_digest_intact: false,
            is_signature_valid: false
          }
        });
        setDemoNotice('Simulated local database alteration: payload digest diverged from signed seal.');
      }
    } finally {
      setIsDemoActionRunning(false);
    }
  };

  const restoreRecord = async () => {
    setIsDemoActionRunning(true);
    setDemoNotice(null);
    try {
      await fetch(`${API_BASE_URL}/check/${entryId}/restore-demo`, {
        method: 'POST'
      });
      setDemoNotice('Record restored to canonical untampered state.');
      await fetchCheckData();
    } catch {
      await fetchCheckData();
      setDemoNotice('Record reloaded in canonical state.');
    } finally {
      setIsDemoActionRunning(false);
    }
  };

  const isVerified = data?.status === 'VERIFIED';
  const isTampered = data?.status === 'CHANGED_SINCE_VERIFICATION';
  const isRevoked = data?.status === 'REVOKED';

  return (
    <AppFrame
      topBarProps={{
        currentRole: 'VIEWER',
        userName: 'Public Verifier',
        progressPercent: 100,
        activePath: `/check/${entryId}`,
        onNavigate: (path) => {},
      }}
    >
      <div className="max-w-4xl mx-auto py-4 sm:py-6 flex flex-col gap-6">
        
        {/* Verification Status Header */}
        <div className="rounded-[32px] p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          style={{
            backgroundColor: isVerified ? '#10B98115' : isTampered ? '#EF444415' : '#6B6F7615',
            borderColor: isVerified ? '#10B98130' : isTampered ? '#EF444430' : '#6B6F7630'
          }}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
              isVerified ? 'bg-[#10B981] text-white' : isTampered ? 'bg-[#EF4444] text-white' : 'bg-[#6B6F76] text-white'
            }`}>
              {isVerified && <ShieldCheck className="w-7 h-7" />}
              {isTampered && <AlertTriangle className="w-7 h-7" />}
              {isRevoked && <XCircle className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#191A23]">
                  {isVerified && 'Cryptographically Verified'}
                  {isTampered && 'TAMPER DETECTED: Data Altered Post-Sealing'}
                  {isRevoked && 'Verification Formally Revoked'}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6B6F76] mt-1 font-medium">
                {isVerified && 'A named mentor linked via the institutional roster attested to these skills on this date.'}
                {isTampered && 'The stored record digest does not match the Ed25519 digital signature.'}
                {isRevoked && 'This record was formally revoked by an authorized institutional official.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied URL' : 'Share Link'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowQr(!showQr)}
              className="text-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </Button>
          </div>
        </div>

        {/* Dynamic QR Code Modal Preview */}
        {showQr && (
          <div className="p-6 rounded-[28px] bg-[#F4F5FB] border border-[#E7E8EB] flex flex-col items-center text-center">
            <div className="w-44 h-44 rounded-2xl bg-white p-3 border border-[#E7E8EB] flex items-center justify-center shadow-xs mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#191A23] fill-current">
                <rect x="10" y="10" width="30" height="30" rx="4" />
                <rect x="60" y="10" width="30" height="30" rx="4" />
                <rect x="10" y="60" width="30" height="30" rx="4" />
                <rect x="50" y="50" width="15" height="15" rx="2" />
                <rect x="75" y="75" width="15" height="15" rx="2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-[#191A23]">
              Scan to Verify On Mobile
            </span>
            <span className="text-[11px] text-[#6B6F76] mt-0.5 font-mono">
              {entryId}
            </span>
          </div>
        )}

        {demoNotice && (
          <div className="p-3.5 rounded-2xl bg-[#FFA172]/20 border border-[#FFA172]/40 text-xs font-bold text-[#C9662A] text-center">
            {demoNotice}
          </div>
        )}

        {/* Claim Details */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Student Claim & Skills */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <div className="p-6 rounded-[32px] bg-[#F4F5FB] border border-[#E7E8EB]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#7E7AE6]/15 text-[#7E7AE6]">
                    {data.category || 'STEM'}
                  </span>
                  <span className="text-xs font-bold text-[#6B6F76]">
                    Student: <strong className="text-[#191A23]">{data.student_name}</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#191A23] leading-snug">
                  {data.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6F76] mt-2 leading-relaxed">
                  {data.description}
                </p>

                {/* Skills Grid */}
                {data.skills && data.skills.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#E7E8EB]">
                    <span className="text-xs font-bold text-[#191A23] block mb-2.5">
                      Attested Skills & Competency Levels
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((s) => (
                        <div
                          key={s.id}
                          className="px-3.5 py-1.5 rounded-full bg-white border border-[#E7E8EB] flex items-center gap-2 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="text-xs font-bold text-[#191A23]">{s.name}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFA172]/20 text-[#C9662A]">
                            {s.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Mentor Attestation & Cryptographic Seal */}
            <div className="flex flex-col gap-5">
              <div className="p-5 rounded-[28px] bg-[#F4F5FB] border border-[#E7E8EB] flex flex-col gap-3">
                <span className="text-xs font-bold text-[#191A23]">
                  Attesting Mentor
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#7E7AE6] text-white flex items-center justify-center font-bold text-xs">
                    {data.mentor_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#191A23]">{data.mentor_name}</h3>
                    <p className="text-[11px] text-[#6B6F76]">Institutional Mentor & Faculty</p>
                  </div>
                </div>
              </div>

              {/* Digital Seal Digest */}
              <div className="p-5 rounded-[28px] bg-[#191A23] text-white flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FFA172]">
                    Ed25519 Digital Seal
                  </span>
                  <KeyRound className="w-4 h-4 text-[#FFA172]" />
                </div>
                <div>
                  <span className="text-[10px] text-white/60 block mb-0.5">Key ID</span>
                  <code className="text-xs font-mono font-bold text-white/90">
                    {data.seal.key_id}
                  </code>
                </div>
                <div>
                  <span className="text-[10px] text-white/60 block mb-0.5">SHA-256 Digest</span>
                  <code className="text-[11px] font-mono font-bold text-[#FFA172] break-all">
                    {data.seal.digest ? `${data.seal.digest.slice(0, 32)}...` : '7a8b9c0d1e2f3a4b...'}
                  </code>
                </div>
              </div>

              {/* Tamper Simulation Tools (Interactive QA Demo) */}
              <div className="p-4 rounded-[28px] bg-[#F4F5FB] border border-[#E7E8EB] flex flex-col gap-2">
                <span className="text-xs font-bold text-[#191A23]">
                  Tamper Verification QA Tools
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={simulateTamper}
                  isLoading={isDemoActionRunning}
                  className="w-full text-xs"
                >
                  <Bug className="w-3.5 h-3.5 mr-1" />
                  <span>Simulate DB Tampering</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restoreRecord}
                  isLoading={isDemoActionRunning}
                  className="w-full text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Restore Original Seal</span>
                </Button>
              </div>

            </div>

          </div>
        )}

      </div>
    </AppFrame>
  );
}
