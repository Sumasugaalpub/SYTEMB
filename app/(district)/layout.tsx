import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { DraftBoot } from "@/components/phone/DraftBoot";
import { RouteGuard } from "@/components/system/RouteGuard";

/** Portal 4 — mobile web. Phone frame on desktop, full width on a real phone. */
export default function DistrictLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh/0.9)] overflow-y-auto">
      <DraftBoot>
        <PhoneFrame>
          <RouteGuard>{children}</RouteGuard>
        </PhoneFrame>
      </DraftBoot>
    </div>
  );
}
