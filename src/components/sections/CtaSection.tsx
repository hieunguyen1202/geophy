import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import type { BaseListMenu } from '../../types';
import '../../styles/sections.css';
import { useNavigate } from 'react-router-dom';

interface CtaSectionProps {
  listMenuUser: BaseListMenu[];
}

const CtaSection: React.FC<CtaSectionProps> = () => {
  const navigate = useNavigate();

  return (
    <section className="py-5 bg-primary text-white section-hover">
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8}>
            <h2 className="display-5 fw-bold mb-4">
              Sẵn Sàng Chuyển Đổi Trải Nghiệm Học Tập Của Bạn?
            </h2>
            <p className="lead mb-5">
              Tham gia cùng hàng nghìn học sinh đang học tập thông minh hơn với nền tảng tương tác của chúng tôi.
              Bắt đầu hành trình của bạn ngay hôm nay và khám phá niềm vui trong việc học Hình Học và Vật Lý.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Button variant="light" size="lg"  className="px-4 btn-hover" onClick={() => navigate('/resource')}>
                Bắt Đầu Học
              </Button>
              <Button variant="outline-light" size="lg" className="px-4 btn-hover">
                Xem Demo
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default CtaSection;