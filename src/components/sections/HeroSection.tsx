import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import type { BaseListMenu } from '../../types';
// import heroImage from '../../assets/images/landingpage/hero-image.png';
import heroVideo from '../../assets/images/landingpage/demo.mp4';
interface HeroSectionProps {
  listMenuUser: BaseListMenu[];
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const navigate = useNavigate();

  return (
    <section className="py-5 bg-light">
      <Container>
        <Row className="align-items-center min-vh-75">
          <Col lg={6} className="mb-4 mb-lg-0">
            <h1 className="display-4 fw-bold mb-4">
              Nền Tảng Học Tập Tương Tác cho Hình Học và Vật Lý
            </h1>
            <p className="lead text-muted mb-4">
              Nâng cao hiểu biết về Hình Học và Vật Lý thông qua các mô phỏng 3D tương tác,
              mô hình trực quan và trải nghiệm học tập hấp dẫn được thiết kế đặc biệt cho học sinh trung học.
            </p>
            <div className="d-flex gap-3">
              <Button variant="primary" size="lg" onClick={() => navigate('/resource')}>
                Bắt Đầu Học
              </Button>
              <Button variant="outline-primary" size="lg" onClick={() => navigate('/unity-simulations')}>
                Khám Phá Tính Năng
              </Button>
            </div>
          </Col>
          <Col lg={6}>
            <div className="position-relative">
              <video
                className="img-fluid rounded-3 shadow-lg hover-image"
                controls
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                style={{
                  pointerEvents: 'none', 
                  userSelect: 'none'    
                }}
                preload="auto"
              >
                <source src={heroVideo} type="video/mp4" />
                Nền Tảng Học Tập Tương Tác
              </video>
            </div>
            {/* <div className="position-relative">
              <img
                src={heroImage}
                alt="Nền Tảng Học Tập Tương Tác"
                className="img-fluid rounded-3 shadow-lg hover-image"
              /> */}
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection; 