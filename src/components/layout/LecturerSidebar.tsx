import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { listMenuLecturer } from '../../config';
import '../../styles/sidebar.css';

interface LecturerSidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const LecturerSidebar: React.FC<LecturerSidebarProps> = ({ onCollapse }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="mobile-menu-toggle d-md-none"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <FaBars size={16} /> : <FaTimes size={16} />}
      </button>

      {/* Desktop Toggle Button */}
      <button
        className="desktop-menu-toggle d-none d-md-block"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        style={{
          left: collapsed ? '80px' : '260px',
          transition: 'left 0.3s ease'
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* Sidebar */}
      <div className={`sidebar-container bg-white border-end d-flex flex-column ${collapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="p-4 border-bottom">
          <h4 className={`mb-0 text-primary fw-bold ${collapsed ? 'd-none' : ''}`}>Giáo Viên</h4>
          <p className={`text-muted small mb-0 mt-1 ${collapsed ? 'd-none' : ''}`}>Trang quản lý</p>
        </div>

        {/* Navigation */}
        <Nav className="flex-column p-3 flex-grow-1 sidebar-scroll">
          {listMenuLecturer.map((item, index) => {
            const isTestActive =
              item.path === '/lecturer/test' &&
              (
                location.pathname.startsWith('/lecturer/test') ||
                location.pathname === '/lecturer/add-test' ||
                location.pathname.startsWith('/lecturer/update-test')
              );

            const isClassesActive =
              item.path === '/lecturer/classes' &&
              location.pathname === '/lecturer/classes';

            const isActive = isTestActive || isClassesActive;

            const Icon = item.icon; // icon là function component

            return (
              <Nav.Link
                key={index}
                as={Link}
                to={item.path}
                className={
                  `d-flex align-items-center py-3 px-3 rounded-3 mb-2 transition-all ${isActive ? 'active' : 'hover-bg-light'}`
                }
                title={collapsed ? item.name : undefined}
              >
                {Icon && <Icon size={18} className="me-2" />}
                {!collapsed && <span>{item.name}</span>}
              </Nav.Link>
            );
          })}
        </Nav>

        {/* Footer */}
        <div className="p-3 border-top mt-auto">
          <div className="d-flex align-items-center justify-content-center">
            <h6 className={`mb-0 text-primary ${collapsed ? 'd-none' : ''}`}>GeoPhy</h6>
          </div>
        </div>
      </div>
    </>
  );
};

export default LecturerSidebar;
