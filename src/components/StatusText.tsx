import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  HeartHandshake,
  HelpCircle,
  MinusCircle,
  RefreshCw,
} from 'lucide-react';
import { ConfirmationStatus, TaskStatus } from '../types';

export const ConfirmationStatusLabel: React.FC<{ status: ConfirmationStatus }> = ({
  status,
}) => {
  switch (status) {
    case 'Confirmed by Resident':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Confirmed by Resident
        </span>
      );
    case 'Confirmed through authorised representative':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <HeartHandshake className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Confirmed via Representative
        </span>
      );
    case 'Staff Verified':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 whitespace-nowrap">
          <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Staff Verified
        </span>
      );
    case 'Pending Review':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Pending Review
        </span>
      );
    case 'Outdated':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Outdated
        </span>
      );
    case 'Inactive':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
          <MinusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Inactive
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {status}
        </span>
      );
  }
};

export const TaskStatusLabel: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Completed
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          In Progress
        </span>
      );
    case 'Deferred':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Deferred
        </span>
      );
    case 'Unable to Complete':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Unable to Complete
        </span>
      );
    case 'Reassigned':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
          <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Reassigned
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
          <MinusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Not Started
        </span>
      );
  }
};
