import * as LucideIcons from 'lucide-react';

/**
 * Componente que renderiza um ícone Lucide dinamicamente pelo nome.
 * Recebe o nome como string (ex: "Briefcase") e renderiza o ícone correspondente.
 * Se o nome não for encontrado, renderiza um ícone genérico de tag.
 */
export default function CategoryIcon({ name, size = 18, color = 'currentColor', ...props }) {
  const IconComponent = LucideIcons[name];

  if (!IconComponent) {
    return <LucideIcons.Tag size={size} color={color} {...props} />;
  }

  return <IconComponent size={size} color={color} {...props} />;
}
