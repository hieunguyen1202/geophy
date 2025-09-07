import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import type { BaseListMenu } from '../../types';
import '../../styles/landing.css';

interface FooterProps {
  listMenuUser?: BaseListMenu[];
}

const Footer: React.FC<FooterProps> = ({ listMenuUser = [] }) => {
  return (
    <footer className="landing-footer">
      <Container>
        <Row className="g-4">
          {/* About Section */}
          <Col md={3}>
            <h3 className="h5 fw-bold mb-3">Về GeoPhy</h3>
            <p className="text-muted">
              Nền tảng học tập tương tác cho học sinh trung học để làm chủ Hình Học và Vật Lý thông qua các mô phỏng trực quan.
            </p>
          </Col>

          {/* Quick Links */}
          <Col md={3}>
            <h3 className="h5 fw-bold mb-3">Liên Kết Nhanh</h3>
            <Nav className="flex-column">
              {listMenuUser.map((menu, index) => (
                <Nav.Link 
                  key={index}
                  as={Link} 
                  to={menu.path}
                  className="text-muted px-0 py-1"
                >
                  {menu.name}
                </Nav.Link>
              ))}
            </Nav>
          </Col>

          {/* Contact Info */}
          <Col md={3}>
            <h3 className="h5 fw-bold mb-3">Liên Hệ</h3>
            <ul className="list-unstyled text-muted">
              <li className="mb-2">Email: contact@geophy.edu</li>
              <li className="mb-2">Điện thoại: 0123456789</li>
              <li className="mb-2">Địa chỉ: Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Thạch Hòa, Thạch Thất, Hà Nội, Việt Nam</li>
            </ul>
          </Col>

          {/* Social Links */}
          <Col md={3}>
            <h3 className="h5 fw-bold mb-3">Theo Dõi Chúng Tôi</h3>
            <div className="d-flex gap-3">
              <a href="#" className="text-muted">
                <FaFacebook size={24} />
              </a>
              <a href="#" className="text-muted">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-muted">
                <FaInstagram size={24} />
              </a>
              <a href="#" className="text-muted">
                <FaLinkedin size={24} />
              </a>
            </div>
          </Col>
        </Row>

        {/* Copyright */}
        <Row className="copyright">
          <Col className="text-center text-muted">
            <p className="mb-0">&copy; {new Date().getFullYear()} GeoPhy.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 