import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Box, Typography } from '@mui/material';
import NavigationBar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { listMenuUser } from '../../config';
import { subjectConfig } from '../../config/subjects';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const ResourcePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavigationBar listMenuUser={listMenuUser} />

      {/* Hero Section */}
      <Box className="bg-primary text-white text-center py-5">
        <Container>
          <Typography variant="h3" className="font-bold mb-2">
            Khám phá Kho tài nguyên học tập
          </Typography>
          <Typography variant="h6" className="opacity-90">
            Chọn một môn học để bắt đầu hành trình của bạn.
          </Typography>
        </Container>
      </Box>

      {/* Subject Selection Section */}
      <Container className="flex-grow-1 py-5">
        <Row className="justify-content-center g-4">
          {Object.entries(subjectConfig).map(([key, subject]) => (
            <Col md={6} lg={4} key={key}>
              <Card
                className="h-100 shadow-lg border-0 transition-transform transform hover:-translate-y-2 cursor-pointer"
                onClick={() => navigate(subject.path)}
              >
                <Card.Body className="p-4 d-flex flex-column text-center">
                  <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                    {subject.icon}
                  </div>
                  <Card.Title as="h4" className="fw-bold mb-3">
                    {subject.title}
                  </Card.Title>
                  <Card.Text className="text-muted mb-4">
                    Khám phá các chương và bài học chi tiết cho môn {subject.title.toLowerCase()}.
                  </Card.Text>
                  <div className="mt-auto">
                    <Typography
                      variant="button"
                      className="text-primary fw-bold d-flex align-items-center justify-content-center"
                    >
                      Bắt đầu học <ArrowForwardIcon className="ms-1" />
                    </Typography>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <Footer listMenuUser={listMenuUser} />
    </div>
  );
};

export default ResourcePage; 