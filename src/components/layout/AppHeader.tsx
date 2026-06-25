import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

type AppHeaderProps = {
  rightSlot?: ReactNode
  variant?: 'site' | 'workbench'
}

const navItems = [
  { label: '印鉴序章', to: '/' },
  { label: '古印源流', to: '/origin' },
  { label: '数字印谱', to: '/gallery' },
  { label: '创作工坊', to: '/workbench' },
]

export default function AppHeader({ rightSlot, variant = 'site' }: AppHeaderProps) {
  return (
    <header className={'site-header ' + (variant === 'workbench' ? 'site-header--workbench' : '')}>
      <div className="site-header__inner">
        <Link to="/" className="brand-lockup" aria-label="返回印鉴序章">
          <span className="brand-seal" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="20" height="20" rx="3.5" stroke="currentColor" strokeWidth="2" />
              <path d="M9 10.5h10M10 15h8M12 19h5M14 10.5v8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>印鉴浮雕工坊</strong>
            <small>Seal Relief Studio</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => 'main-nav__link ' + (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          {rightSlot ?? (
            <>
              <button className="btn-ghost" type="button">帮助</button>
              <Link className="btn-primary" to="/workbench">开始创作</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
