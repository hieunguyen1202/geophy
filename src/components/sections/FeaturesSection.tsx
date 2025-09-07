import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaCube, FaChartLine, FaGamepad, FaUsers, FaBook, FaTrophy } from 'react-icons/fa';
import '../../styles/sections.css';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <FaCube className="text-primary feature-icon" size={40} />,
      title: "Mô Hình 3D",
      description: "Mô hình và mô phỏng 3D tương tác giúp hình dung các khái niệm hình học và vật lý phức tạp."
    },
    {
      icon: <FaBook className="text-primary feature-icon" size={40} />,
      title: "Bài Học Tương Tác",
      description: "Tương tác với các bài học động kết hợp lý thuyết và ứng dụng thực tế."
    },
    {
      icon: <FaGamepad className="text-primary feature-icon" size={40} />,
      title: "Bài Tập Tương Tác",
      description: "Thực hành với các bài tập thực hành và thử thách giải quyết vấn đề theo thời gian thực."
    },
    // {
    //   icon: <FaChartLine className="text-primary feature-icon" size={40} />,
    //   title: "Theo Dõi Tiến Độ",
    //   description: "Theo dõi hành trình học tập của bạn với phân tích chi tiết và các chỉ số hiệu suất."
    // },
    // {
    //   icon: <FaUsers className="text-primary feature-icon" size={40} />,
    //   title: "Học Tập Hợp Tác",
    //   description: "Làm việc cùng với bạn bè thông qua các hoạt động nhóm và chia sẻ kinh nghiệm học tập."
    // },
    // {
    //   icon: <FaTrophy className="text-primary feature-icon" size={40} />,
    //   title: "Hệ Thống Thành Tích",
    //   description: "Duy trì động lực với huy hiệu, phần thưởng và hệ thống bảng xếp hạng cạnh tranh."
    // }
  ];

  return (
    <section className="py-5 section-hover">
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold mb-3">Tính Năng Học Tập Tương Tác</h2>
          <p className="lead text-muted">
            Khám phá cách nền tảng của chúng tôi làm cho việc học Hình Học và Vật Lý trở nên hấp dẫn và hiệu quả
          </p>
        </div>
        <Row className="g-4">
          {features.map((feature, index) => (
            <Col key={index} md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm feature-card">
                <Card.Body className="text-center p-4">
                  <div className="mb-3">{feature.icon}</div>
                  <Card.Title className="h5 mb-3">{feature.title}</Card.Title>
                  <Card.Text className="text-muted">
                    {feature.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default FeaturesSection; 