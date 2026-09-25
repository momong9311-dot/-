import KioskApp from "@/components/kiosk/KioskApp";

export const metadata = { title: "Self Check-In — MERCI MOMONG" };

export default function KioskPage() {
  return (
    <div className="kiosk-surface min-h-dvh bg-[#e7e3da]">
      <div className="mx-auto flex min-h-dvh max-w-[680px] flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.06)]">
        <KioskApp />
      </div>
    </div>
  );
}
