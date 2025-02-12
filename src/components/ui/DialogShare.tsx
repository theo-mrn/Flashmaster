import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2 } from "lucide-react";
import { useState } from "react";

interface DialogShareProps {
  onShare: (email: string) => void;
  id?: string;
}

export function DialogShare({ onShare, id }: DialogShareProps) {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const handleShare = () => {
    onShare(email);
    setEmail("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id={id} variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Partager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Partager le document</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="email"
              type="email"
              placeholder="Adresse email"
              className="col-span-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleShare} disabled={!email}>Partager</Button>
      </DialogContent>
    </Dialog>
  );
}
