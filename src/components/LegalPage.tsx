import Link from 'next/link';
import type { ReactNode } from 'react';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: ReactNode;
}

export default function LegalPage({ title, lastUpdated, intro, children }: LegalPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12">
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Nazad na početnu
        </Link>

        <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">{title}</h1>
        <p className="text-sm text-muted">Poslednje ažuriranje: {lastUpdated}</p>

        {intro && (
          <p className="mt-6 text-base text-foreground/80 leading-relaxed">{intro}</p>
        )}
      </div>

      <div className="legal-content space-y-8">{children}</div>

      <div className="mt-16 pt-8 border-t border-border text-sm text-muted">
        <p>
          Ako imaš pitanja ili komentare u vezi sa ovim dokumentom, kontaktiraj nas na{' '}
          <a
            href="mailto:hello@ugcexecutive.com"
            className="text-primary hover:underline"
          >
            hello@ugcexecutive.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}

interface SectionProps {
  id?: string;
  title: string;
  children: ReactNode;
}

export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-medium mb-4 text-foreground">{title}</h2>
      <div className="space-y-4 text-foreground/80 leading-relaxed">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-base">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2">{children}</ul>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-medium text-foreground mt-6 mb-2">{children}</h3>;
}
