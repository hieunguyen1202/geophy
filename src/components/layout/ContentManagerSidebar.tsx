import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaCog, FaBars, FaTimes, FaListAlt, FaFileAlt, FaColumns, FaTag, FaBookOpen, FaGraduationCap, 
  FaTachometerAlt  } from 'react-icons/fa';
import { listMenuContentManager } from '../../config';
import '../../styles/sidebar.css';

interface ContentManagerSidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const ContentManagerSidebar: React.FC<ContentManagerSidebarProps> = ({ onCollapse }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'tổng quan':
        return <FaTachometerAlt size={18} />;
      case 'câu hỏi':
        return <FaListAlt size={18} />;
      case 'bài viết':
        return <FaFileAlt size={18} />;
      case 'chương':
        return <FaColumns size={18} />;
      case 'tag':
        return <FaTag size={18} />;
      case 'bài học':
        return <FaBookOpen size={18} />;
      case 'lớp học':
        return <FaGraduationCap size={18} />;
      default:
        return <FaCog size={18} />;
    }
  };

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
      <div
        className={`sidebar-container bg-white border-end d-flex flex-column ${collapsed ? 'collapsed' : ''
          }`}
      >
        {/* Header */}
        <div className="p-4 border-bottom">
          <h4 className={`mb-0 text-primary fw-bold ${collapsed ? 'd-none' : ''}`}>
            Quản lý nội dung
          </h4>
          <p className={`text-muted small mb-0 mt-1 ${collapsed ? 'd-none' : ''}`}>
            Trang quản lý
          </p>
        </div>

        {/* Navigation */}
        <Nav className="flex-column p-3 flex-grow-1 sidebar-scroll">
          {listMenuContentManager.map((item, index) => (
            <Nav.Link
              key={index}
              as={Link}
              to={item.path}
              disabled={location.pathname.startsWith(item.path)}
              className={`d-flex align-items-center py-3 px-3 rounded-3 mb-2 transition-all ${location.pathname.startsWith(item.path)
                ? 'active'
                : 'hover-bg-light'
                }`}
              title={collapsed ? item.name : undefined}
            >
              {getIcon(item.name)}
              <span className={`fw-medium ms-3 ${collapsed ? 'd-none' : ''}`}>
                {item.name}
              </span>
            </Nav.Link>
          ))}
        </Nav>

        {/* Footer */}
        <div className="p-3 border-top mt-auto">
          <div className="d-flex align-items-center justify-content-center">
            <h6 className={`mb-0 text-primary ${collapsed ? 'd-none' : ''}`}>
              GeoPhy
            </h6>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentManagerSidebar; 