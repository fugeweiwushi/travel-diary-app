import { redirect } from 'next/navigation';

export default function MobileRootPage() {
  redirect('/m/diaries');
  return null; // Or a loading component if preferred before redirect completes
}
