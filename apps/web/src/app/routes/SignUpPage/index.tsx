import { useSearchParams } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { HeroColumn } from './HeroColumn';
import { AuthForm } from './AuthForm';
import type { AuthMode } from './authHelpers';

interface SignUpPageProps {
  defaultMode?: AuthMode;
}

export default function SignUpPage({ defaultMode = 'signup' }: SignUpPageProps) {
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as AuthMode) || defaultMode;

  return (
    <div className="min-h-screen w-full bg-[#0A0D14] text-text-primary flex flex-col selection:bg-[#7152FF]/30 selection:text-white">
      <PageHeader />

      <main className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <HeroColumn />
          <AuthForm initialMode={initialMode} />
        </div>
      </main>
    </div>
  );
}
