import React from 'react';
import { Container } from 'react-bootstrap';
import '../../styles/content-manager.css';

interface ContentManagerFooterProps {
  collapsed: boolean;
}

const ContentManagerFooter: React.FC<ContentManagerFooterProps> = ({ }) => {
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

export default ContentManagerFooter; 