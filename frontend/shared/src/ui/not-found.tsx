import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from './feedback';
import { buttonVariants } from './button';

export function NotFound({ homePath = '/' }: { homePath?: string }) {
  return (
    <div className="py-10">
      <EmptyState
        icon={<SearchX className="h-10 w-10" />}
        title="404 · Página no encontrada"
        description="La ruta solicitada no existe en este portal."
        action={
          <Link to={homePath} className={buttonVariants({ variant: 'outline' })}>
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
