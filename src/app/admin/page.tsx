import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  redirect('/admin/dashboard');
  return null; // Or a loading component if preferred before redirect completes
}
