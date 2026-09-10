import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ProtocolsPage() {
  redirect('/explore?tab=protocols')
}
