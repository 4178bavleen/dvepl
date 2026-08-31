import { useState } from "react";
import { Mail, MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportOrdersApi } from "@/services/modules";
import toast from "react-hot-toast";
import type { EngineeringDrawing } from "@/types/exportOrders";

interface Props {
  drawing: EngineeringDrawing;
  initialEmail: string;
  initialPhone: string;
  orderCode: string;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export default function SendDrawingModal({
  drawing,
  initialEmail,
  initialPhone,
  orderCode,
  open,
  onClose,
  onSent,
}: Props) {
  const [method, setMethod] = useState<"EMAIL" | "WHATSAPP" | "BOTH">("EMAIL");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [subject, setSubject] = useState(
    `Engineering Drawing for Order ${orderCode}: ${drawing.drawingNo}`,
  );
  const [message, setMessage] = useState(
    `Dear Customer,\n\nPlease find attached the engineering drawing: ${drawing.title} (${drawing.drawingNo}) for your order ${orderCode}.\n\nBest Regards,\nDVEPL Team`,
  );
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if ((method === "EMAIL" || method === "BOTH") && !email) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    if ((method === "WHATSAPP" || method === "BOTH") && !phone) {
      toast.error("Please enter a customer mobile number.");
      return;
    }

    setIsSending(true);
    try {
      const res = await exportOrdersApi.sendDrawing({
        drawingId: drawing.id,
        method,
        email: email || null,
        phone: phone || null,
        subject: subject || null,
        message: message || null,
      });

      if (res.success) {
        if (res.data.emailSent) toast.success("Drawing sent via email successfully!");
        if (res.data.whatsappLink) {
          toast.success("WhatsApp link generated. Opening WhatsApp...");
          window.open(res.data.whatsappLink, "_blank", "noopener,noreferrer");
        }
        onSent();
        onClose();
      } else {
        toast.error(res.message || "Failed to send drawing.");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "An error occurred while sending the drawing.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isSending) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div>
            <DialogTitle>Send Engineering Drawing</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {drawing.drawingNo} ({drawing.title})
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Method Selection */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Send Method
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["EMAIL", "WHATSAPP", "BOTH"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all ${
                    method === m
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-input bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {m === "EMAIL" && <Mail className="w-4.5 h-4.5" />}
                  {m === "WHATSAPP" && <MessageSquare className="w-4.5 h-4.5" />}
                  {m === "BOTH" && (
                    <div className="flex gap-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {m === "EMAIL" && "Email"}
                  {m === "WHATSAPP" && "WhatsApp"}
                  {m === "BOTH" && "Both"}
                </button>
              ))}
            </div>
          </div>

          {(method === "EMAIL" || method === "BOTH") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Customer Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
          )}

          {(method === "WHATSAPP" || method === "BOTH") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Customer Mobile Number
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 919876543210 (with country code)"
              />
              <p className="text-[10px] text-muted-foreground">
                Include country code (e.g. 91 for India) without '+' or spaces.
              </p>
            </div>
          )}

          {(method === "EMAIL" || method === "BOTH") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email Subject
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter custom email subject..."
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Message Details
            </Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to the customer..."
              rows={4}
              className="w-full p-3 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSending} className="gap-2">
            {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSending ? "Sending…" : <><Send className="h-4 w-4" /> Send Drawing</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
