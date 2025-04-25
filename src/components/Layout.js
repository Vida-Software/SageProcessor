import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import EmailConfigNotifier from './EmailConfigNotifier'
import ConfigMenu from './ConfigMenu'
import ThemeToggle from './ThemeToggle'
import {
  Bars3Icon,
  HomeIcon,
  XMarkIcon,
  CodeBracketSquareIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  InboxStackIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PaperAirplaneIcon,
  WindowIcon, // Ícono para portales
  CpuChipIcon, // Ícono para el logo de SAGE
  EnvelopeIcon, // Ícono para configuraciones de correo
  Cog8ToothIcon, // Ícono para maestros
  PencilSquareIcon, // Ícono para YAML Editor,
  ServerIcon, // Ícono para DuckDB Swarm
  DatabaseIcon, // Ícono para bases de datos
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'YAML Studio', href: '/studio', icon: CodeBracketSquareIcon },
  { 
    name: 'YAML Editor', 
    href: '/yaml-editor',  // Página de redireccionamiento
    icon: PencilSquareIcon, 
  },
  { name: 'Casillas de Datos', href: '/admin/data-boxes', icon: InboxStackIcon },
  { name: 'Portales', href: '/admin/portales', icon: WindowIcon },
  { name: 'Control de Acceso', href: '/access', icon: ShieldCheckIcon },
  { 
    name: 'DuckDB Swarm', 
    href: '#',
    icon: ServerIcon,
    submenu: [
      { name: 'Dashboard', href: '/admin/duckdb-swarm/dashboard' },
      { name: 'Control de Despliegue', href: '/admin/duckdb-swarm/simple' },
      { name: 'Flujos Yato', href: '/admin/duckdb-swarm/flujos' },
    ]
  },
  { 
    name: 'Maestros', 
    href: '#',
    icon: Cog8ToothIcon,
    submenu: [
      { name: 'Organizaciones', href: '/maestros/organizaciones' },
      { name: 'Países', href: '/maestros/paises' },
      { name: 'Productos', href: '/maestros/productos' },
      { name: 'Instalaciones', href: '/maestros/instalaciones' },
      { name: 'Emisores', href: '/admin/emisores' },
    ]
  },
]

const MobileMenu = ({ isOpen, setIsOpen, navigation, currentPath, openSubmenus, toggleSubmenu }) => {
  return (
    <div
      className="lg:hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        zIndex: 50,
        transform: 'translateZ(0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
      }}
    >
      <div
        className={`absolute inset-0 bg-gray-900/80 transition-opacity duration-300`}
        style={{
          opacity: isOpen ? 1 : 0,
        }}
        onClick={() => setIsOpen(false)}
      />

      <div
        className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-800"
        style={{
          transform: `translate3d(${isOpen ? '0' : '-100%'}, 0, 0)`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 md:h-10 md:w-10 text-indigo-600" aria-hidden="true" />
            <span className="ml-2 text-xl md:text-2xl font-bold text-indigo-600">SAGE</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav className="flex flex-1 flex-col px-6 pb-4">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    {item.submenu ? (
                      <div>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`
                            w-full group flex justify-between items-center gap-x-3 rounded-md p-2 text-sm md:text-base leading-6 font-semibold
                            text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700
                          `}
                        >
                          <div className="flex items-center gap-x-3">
                            <item.icon
                              className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-gray-400 group-hover:text-indigo-600"
                              aria-hidden="true"
                            />
                            {item.name}
                          </div>
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${openSubmenus[item.name] ? 'rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {openSubmenus[item.name] && (
                          <ul className="mt-1 pl-9 space-y-1">
                            {item.submenu.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  href={subItem.href}
                                  className={`
                                    block p-2 text-sm font-medium rounded-md
                                    ${currentPath.includes(subItem.href)
                                      ? 'text-indigo-600 dark:text-indigo-400'
                                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                                    }
                                  `}
                                  onClick={() => setIsOpen(false)}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm md:text-base leading-6 font-semibold
                          ${currentPath === item.href
                            ? 'bg-gray-50 dark:bg-gray-700 text-indigo-600'
                            : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon
                          className={`h-6 w-6 md:h-7 md:w-7 shrink-0 ${
                            currentPath === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                        {item.external && (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 ml-1 opacity-70" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                            />
                          </svg>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState({})
  const router = useRouter()

  // Abrir automáticamente el submenú cuando se navega a una de sus páginas
  useEffect(() => {
    // Comprueba la ruta actual
    if (router.pathname.includes('/maestros/') || router.pathname === '/admin/emisores') {
      // Abre el submenú de Maestros
      setOpenSubmenus(prev => ({ ...prev, 'Maestros': true }));
    }
    if (router.pathname.includes('/admin/duckdb-swarm/')) {
      // Abre el submenú de DuckDB Swarm
      setOpenSubmenus(prev => ({ ...prev, 'DuckDB Swarm': true }));
    }
  }, [router.pathname]);

  useEffect(() => {
    setSidebarOpen(false)
  }, [router.asPath])

  const toggleSubmenu = (menuName) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background dark:text-gray-100">
      <MobileMenu
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        navigation={navigation}
        currentPath={router.pathname}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center">
              <CpuChipIcon className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-indigo-600" aria-hidden="true" />
              <span className="ml-2 text-xl md:text-2xl lg:text-3xl font-bold text-indigo-600">SAGE</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {item.submenu ? (
                        <div>
                          <button
                            onClick={() => toggleSubmenu(item.name)}
                            className={`
                              w-full group flex justify-between items-center gap-x-3 rounded-md p-2 text-sm md:text-base lg:text-lg leading-6 font-semibold
                              text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700
                            `}
                          >
                            <div className="flex items-center gap-x-3">
                              <item.icon
                                className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 shrink-0 text-gray-400 group-hover:text-indigo-600"
                                aria-hidden="true"
                              />
                              {item.name}
                            </div>
                            <svg
                              className={`w-5 h-5 transition-transform duration-200 ${openSubmenus[item.name] ? 'rotate-180' : ''}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {openSubmenus[item.name] && (
                            <ul className="mt-1 pl-9 space-y-1">
                              {item.submenu.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.href}
                                    className={`
                                      block p-2 text-sm font-medium rounded-md
                                      ${router.asPath.includes(subItem.href)
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                                      }
                                    `}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noopener noreferrer" : undefined}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm md:text-base lg:text-lg leading-6 font-semibold
                            ${router.pathname === item.href
                              ? 'bg-gray-50 dark:bg-gray-700 text-indigo-600'
                              : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <item.icon
                            className={`h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 shrink-0 ${
                              router.pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                          {item.external && (
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 ml-1 opacity-70" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                              />
                            </svg>
                          )}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <EmailConfigNotifier />
              <ConfigMenu />
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}