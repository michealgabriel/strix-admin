import { useState } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { errorMessage } from "@/lib/api";
import { useImportDraftsMutation } from "./studioApi";

const EXAMPLE = `{
  "posts": [
    {
      "agent": "NovaLeaks",
      "title": "GTA 6 trailer 3 is here",
      "text": "Rockstar just dropped it, via IGN. What did you spot? #GTA6#Rockstar",
      "card_headline": "Trailer 3 is here",
      "tagged_games": ["GTA 6"],
      "source_name": "IGN",
      "source_url": "https://www.ign.com/…",
      "video": {
        "clip": "Trailer 2 beach chase",
        "segments": [{ "start": 3, "end": 9 }],
        "overlays": [{ "text": "TRAILER 3", "start": 0, "end": 3 }],
        "voiceover": "Trailer three just dropped…",
        "music": "Hype beat 1",
        "format": "vertical"
      }
    }
  ],
  "chats": [
    { "channel": "GTA Hub", "messages": [{ "agent": "NovaLeaks", "text": "Trailer 3!" }, { "agent": "PixelPundit", "text": "Too good to be true?" }] }
  ]
}`;

// Drafts written outside Strix (for now, by Claude Code) become drafts like the curators' ones
export default function ImportDialog({ onDone }) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(null);
  const [problems, setProblems] = useState(null);
  const [send, { isLoading }] = useImportDraftsMutation();

  const parse = () => {
    try {
      return JSON.parse(text);
    } catch {
      setProblems({ import: "That isn't valid JSON." });
      return null;
    }
  };

  const run = async (check) => {
    setProblems(null);
    const data = parse();
    if (!data) return;
    try {
      const result = await send({ ...data, ...(check ? { check: true } : {}) }).unwrap();
      if (check) {
        setChecked(result.summary);
      } else {
        toast.success(result.message);
        const videoProblems = Object.values(result.made?.video_problems ?? {});
        if (videoProblems.length) toast.warning(`Some videos didn't start: ${videoProblems.join("; ")}`);
        onDone();
      }
    } catch (e) {
      setChecked(null);
      setProblems(e?.data?.errors ?? { import: errorMessage(e) });
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Import drafts</DialogTitle>
        <DialogDescription>
          Paste posts and channel chats as JSON. They become drafts like the curators' ones, with news cards, and posts with a video plan start rendering.
        </DialogDescription>
      </DialogHeader>
      <Textarea
        rows={14}
        className="font-mono text-xs"
        aria-label="Drafts JSON"
        placeholder={EXAMPLE}
        value={text}
        onChange={(e) => { setText(e.target.value); setChecked(null); }}
      />
      {problems && (
        <div role="alert" className="space-y-1 rounded-lg border border-destructive/40 p-3 text-sm">
          <p className="font-medium text-destructive">Nothing was imported. Fix these first:</p>
          <ul className="list-disc pl-5">
            {Object.entries(problems).map(([where, message]) => <li key={where}><code className="text-xs">{where}</code>: {message}</li>)}
          </ul>
        </div>
      )}
      {checked && (
        <p className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="size-4" /> Ready: {checked.posts} posts, {checked.chats} chats, {checked.videos} videos.
        </p>
      )}
      <DialogFooter className="gap-2">
        <Button variant="outline" disabled={isLoading || !text.trim()} onClick={() => run(true)}>Check</Button>
        <Button disabled={isLoading || !checked} onClick={() => run(false)}>{isLoading ? <Loader2 className="animate-spin" /> : <FileUp />} Import</Button>
      </DialogFooter>
    </div>
  );
}
