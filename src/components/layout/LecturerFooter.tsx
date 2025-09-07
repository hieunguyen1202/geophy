import React from 'react';
import { Container } from 'react-bootstrap';
import '../../styles/content-manager.css';

interface LecturerFooterProps {
  collapsed: boolean;
}

const LecturerFooter: React.FC<LecturerFooterProps> = ({ }) => {
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

export default LecturerFooter; 