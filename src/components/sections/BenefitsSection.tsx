import React from 'react';
import { Container, Row, Col, ListGroup } from 'react-bootstrap';
import '../../styles/sections.css';
import benefitImage from '../../assets/images/landingpage/benefits-image.png'

const benefits = [
  {
    title: 'Hiểu Biết Sâu Sắc',
    description: 'Nắm vững các khái niệm phức tạp thông qua hình ảnh trực quan và mô phỏng thực hành.'
  },
  {
    title: 'Học Tập Hấp Dẫn',
    description: 'Duy trì động lực với các tính năng gamification, câu đố và thử thách tương tác.'
  },
  {
    title: 'Tiến Độ Cá Nhân',
    description: 'Theo dõi hành trình học tập của bạn với phân tích chi tiết và nội dung thích ứng.'
  },
  {
    title: 'Môi Trường Hợp Tác',
    description: 'Học tập cùng với bạn bè thông qua các hoạt động nhóm và chia sẻ kinh nghiệm.'
  }
];

const BenefitsSection: React.FC = () => {
  return (
    <section className="py-5 bg-light section-hover">
      <Container>
        <Row className="align-items-center">
          <Col lg={6} className="mb-4 mb-lg-0">
            <h2 className="display-5 fw-bold mb-4">
              Tại Sao Chọn Nền Tảng Học Tập Của Chúng Tôi?
            </h2>
            <p className="lead text-muted mb-4">
              Nền tảng của chúng tôi được thiết kế để giải quyết những thách thức học tập phổ biến trong Hình Học và Vật Lý,
              giúp các môn học này trở nên dễ tiếp cận và thú vị hơn cho học sinh trung học.
            </p>
            <ListGroup variant="flush" className="bg-transparent">
              {benefits.map((benefit, index) => (
                <ListGroup.Item key={index} className="bg-transparent border-0 ps-0 benefit-item">
                  <h5 className="mb-2">{benefit.title}</h5>
                  <p className="text-muted mb-3">{benefit.description}</p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col lg={6}>
            <div className="position-relative">
              <img
                src={benefitImage}
                alt="Lợi Ích Học Tập"
                className="img-fluid rounded-3 shadow-lg hover-image"
              />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default BenefitsSection; 