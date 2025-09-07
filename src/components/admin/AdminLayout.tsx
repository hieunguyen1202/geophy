import React, { useState } from 'react';
import { Container} from 'react-bootstrap';
import AdminSidebar from './AdminSidebar';
import '../../styles/content-manager.css';
import AdminNavbar from './AdminNavbar';
import AdminFooter from './AdminFooter';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      <AdminNavbar />
      
      <div className="flex-grow-1 d-flex">
        <AdminSidebar onCollapse={setSidebarCollapsed} />
        
        <main 
          className={`flex-grow-1 transition-all ${
            sidebarCollapsed ? 'ms-5' : 'ms-0'
          }`}
          style={{ 
            marginLeft: sidebarCollapsed ? '80px' : '280px',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Container fluid className="p-4">
            {children}
          </Container>
        </main>
      </div>
      
      <AdminFooter collapsed={sidebarCollapsed} />
    </div>
  );
};

export default AdminLayout;
