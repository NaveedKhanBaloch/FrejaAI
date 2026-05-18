import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <Card>
      <h2 className="font-semibold">Restaurant settings</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="rounded-md border border-border p-2" placeholder="Restaurant name" />
        <input className="rounded-md border border-border p-2" placeholder="ElevenLabs voice ID" />
        <input className="rounded-md border border-border p-2" placeholder="Vonage number" />
        <select className="rounded-md border border-border p-2"><option>Europe/Stockholm</option><option>Europe/Copenhagen</option><option>Europe/Oslo</option></select>
      </div>
    </Card>
  );
}
