import React from 'react';
import { Container } from 'react-bootstrap';
import '../../styles/content-manager.css';

interface AdminFooterProps {
  collapsed?: boolean;
}

const AdminFooter: React.FC<AdminFooterProps> = ({ }) => {
  return (
    <footer className="content-manager-footer">
      <Container fluid>
        <div className="text-muted text-center py-3">
          &copy; {new Date().getFullYear()} GeoPhy.
        </div>
      </Container>
    </footer>
  );
};

export default AdminFooter; 