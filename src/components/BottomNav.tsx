import './BottomNav.css';

export type Screen = 'home' | 'about';

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

const ITEMS: { id: Screen; label: string }[] = [
  { id: 'home', label: 'בית' },
  { id: 'about', label: 'אודות' },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="bottom-nav__item"
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
