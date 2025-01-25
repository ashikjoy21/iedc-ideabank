import React from 'react';
import { 
  BookOpen, 
  Leaf, 
  Heart, 
  Users, 
  Lightbulb,
  Tag,
  LucideIcon,
  LucideProps
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Leaf,
  Heart,
  Users,
  Lightbulb,
  Tag
};

interface CategoryIconProps extends LucideProps {
  name: string;
}

export default function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = iconMap[name] || iconMap.Tag;
  return <Icon {...props} />;
} 