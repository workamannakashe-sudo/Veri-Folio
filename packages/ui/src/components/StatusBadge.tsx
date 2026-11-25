import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';

export type StatusType = 'APPROVED' | 'IN_REVIEW' | 'SUBMITTED' | 'REJECTED' | 'DRAFT' | 'VERIFIED';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = {
    APPROVED: {
      bg: 'bg-[#10B981]/15 text-[#059669] border-[#10B981]/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      text: label || 'Approved'
    },
    VERIFIED: {
      bg: 'bg-[#10B981]/15 text-[#059669] border-[#10B981]/30',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      text: label || 'Verified'
    },
    IN_REVIEW: {
      bg: 'bg-[#FFA172]/20 text-[#C9662A] border-[#FFA172]/40',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: label || 'In Review'
    },
    SUBMITTED: {
      bg: 'bg-[#7E7AE6]/15 text-[#625CCB] border-[#7E7AE6]/30',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: label || 'Submitted'
    },
    DRAFT: {
      bg: 'bg-[#6B6F76]/15 text-[#6B6F76] border-[#6B6F76]/30',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: label || 'Draft'
    },
    REJECTED: {
      bg: 'bg-[#EF4444]/15 text-[#DC2626] border-[#EF4444]/30',
      icon: <XCircle className="w-3.5 h-3.5" />,
      text: label || 'Rejected'
    }
  }[status] || {
    bg: 'bg-[#6B6F76]/15 text-[#6B6F76] border-[#6B6F76]/30',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    text: label || status
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs',
        config.bg,
        className
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
}
