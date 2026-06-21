import { notFound } from 'next/navigation';

const CONTENT: Record<string, { title: string; body: string }> = {
  privacy: {
    title: 'Privacy policy (placeholder)',
    body: 'PLACEHOLDER — This is not legal advice. A qualified privacy counsel must draft the privacy policy before any live pilot or personal-data processing beyond local sandbox development.',
  },
  terms: {
    title: 'Terms of service (placeholder)',
    body: 'PLACEHOLDER — These terms are not legally binding. Counsel must review corridor-specific requirements for DE/CH send and IN receive before launch.',
  },
  imprint: {
    title: 'Imprint (placeholder)',
    body: 'PLACEHOLDER — Company identification and regulatory disclosures must be completed before public marketing in DE/CH.',
  },
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = CONTENT[slug];
  if (!doc) notFound();

  return (
    <div className="container narrow">
      <h1>{doc.title}</h1>
      <p className="card">{doc.body}</p>
    </div>
  );
}
