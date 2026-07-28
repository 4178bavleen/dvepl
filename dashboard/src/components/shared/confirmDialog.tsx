import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, ShieldAlert, ArchiveX, RotateCcw } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title = 'Move to Recycle Bin?',
  description = 'This item will be moved to the Recycle Bin. You can restore it later.',
  confirmText = 'Move to Bin',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  loading = false,
}) => {
  const isDanger  = variant === 'danger';
  const isWarning = variant === 'warning';

  const stripCls  = isDanger
    ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-400'
    : isWarning
    ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400'
    : 'bg-gradient-to-r from-primary via-primary/80 to-primary/60';

  const accentBg  = isDanger
    ? 'from-rose-500/[0.07] to-transparent'
    : isWarning
    ? 'from-amber-500/[0.07] to-transparent'
    : 'from-primary/[0.07] to-transparent';

  const iconRing  = isDanger
    ? 'bg-rose-500/10 ring-rose-500/20 text-rose-500'
    : isWarning
    ? 'bg-amber-500/10 ring-amber-500/20 text-amber-500'
    : 'bg-primary/10 ring-primary/20 text-primary';

  const noteCls   = isDanger
    ? 'bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400'
    : isWarning
    ? 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400'
    : 'bg-primary/5 border-primary/15 text-primary';

  const confirmCls = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/25 shadow-md hover:shadow-rose-600/35 hover:shadow-lg'
    : isWarning
    ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/25 shadow-md hover:shadow-amber-500/35 hover:shadow-lg'
    : 'bg-primary hover:bg-primary/90 active:bg-primary/80 shadow-primary/25 shadow-md';

  const Icon = isDanger ? Trash2 : isWarning ? AlertTriangle : ShieldAlert;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[100000] bg-black/30"
        className="z-[100001] sm:max-w-[400px] max-w-[92vw] p-0 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl gap-0"
      >

        {/* Top accent strip */}
        <div className={`w-full h-[3px] ${stripCls}`} />

        {/* Body */}
        <div className={`bg-gradient-to-b ${accentBg} px-6 pt-6 pb-5 space-y-4`}>

          {/* Icon + Title + Description */}
          <div className="flex gap-4 items-start">
            <div className={`mt-0.5 shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ring-2 ${iconRing}`}>
              <Icon className="w-5 h-5" strokeWidth={2.2} />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <DialogTitle className="text-[15px] font-bold leading-snug text-foreground tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>

          {/* Soft-delete hint (only for danger variant) */}
          {isDanger && (
            <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[12px] font-medium border bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <RotateCcw className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>This item will be moved to the <strong>Recycle Bin</strong>. You can restore it anytime from Settings → Recycle Bin.</span>
            </div>
          )}

          {/* Warning note for non-danger */}
          {!isDanger && (
            <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px] font-medium border ${noteCls}`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isWarning
                  ? 'Please review carefully before proceeding.'
                  : 'This action will modify your data.'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2.5 px-6 py-4 bg-muted/20 border-t border-border/50">
          {/* Subtle label on left */}
          <p className="text-[11px] text-muted-foreground/60 hidden sm:block">
            {isDanger ? 'Recoverable from Recycle Bin' : 'Review before confirming'}
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9 px-5 text-[13px] font-semibold rounded-xl border-border/70 hover:bg-muted/60 transition-all"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={`h-9 px-5 text-[13px] font-semibold rounded-xl text-white transition-all duration-200 ${confirmCls}`}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Processing…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {confirmText}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
