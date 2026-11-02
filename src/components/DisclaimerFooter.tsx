import type { Locale } from "@/lib/session";
import { vi } from "@/i18n/vi";
import { en } from "@/i18n/en";

type Props = { locale: Locale };

export function DisclaimerFooter({ locale }: Props) {
  const text = locale === "vi" ? vi.disclaimer : en.disclaimer;
  return (
    <footer className="mt-auto border-t border-cocoa/15 bg-paper px-4 py-6 text-sm text-cocoa/80">
      <p className="mx-auto max-w-4xl leading-relaxed">{text}</p>
    </footer>
  );
}
