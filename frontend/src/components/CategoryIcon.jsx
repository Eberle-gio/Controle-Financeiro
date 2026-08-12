import * as LucideIcons from 'lucide-react';

const CategoryIcon = ({ name, size = 18, color = 'currentColor', ...props }) => {
  const IconComponent = LucideIcons[name];

  if (!IconComponent) {
    return <LucideIcons.Tag size={size} color={color} {...props} />;
  }

  return <IconComponent size={size} color={color} {...props} />;
};

export default CategoryIcon;
