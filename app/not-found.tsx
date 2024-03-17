import Link from 'next/link';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="px-8 py-20">
      <EmptyState
        icon={HiOutlineQuestionMarkCircle}
        title="That page is not in the catalogue"
        body="The link you followed does not match any route in this app."
        action={
          <Link
            href="/"
            className="mt-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:brightness-110"
          >
            Back to the shelf
          </Link>
        }
      />
    </div>
  );
}
