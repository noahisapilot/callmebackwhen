import CallDetailClient from './CallDetailClient';
import CallHistoryClient from './CallHistoryClient';

interface PageProps {
  params: Promise<{ id?: string[] }>;
}

// Generate static params for the optional catch-all
// This pre-renders /calls (empty array = base path)
// Dynamic paths like /calls/[id] are handled client-side
export function generateStaticParams() {
  return [{ id: [] }]; // Pre-render /calls only
}

// Optional catch-all handles both /calls and /calls/[id]
export default async function CallsPage({ params }: PageProps) {
  const { id } = await params;
  const callId = id?.[0];

  if (callId) {
    // /calls/[id] - show call detail
    return <CallDetailClient />;
  }

  // /calls - show call history
  return <CallHistoryClient />;
}
