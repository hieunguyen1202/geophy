import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import {
  FaBookOpen,
  FaFileAlt,
  FaQuestionCircle,
  FaChartBar,
  FaGraduationCap,
  FaSlideshare,
  FaGamepad,
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import ContentManagerSidebar from '../../components/layout/ContentManagerSidebar';
import ContentManagerNavbar from '../../components/layout/ContentManagerNavbar';
import ContentManagerFooter from '../../components/layout/ContentManagerFooter';
import chapterService from '../../services/chapterService';
import type { CurriculumStatistics, ChapterStatByGrade, DifficultyStat } from '../../services/chapterService';
import '../../styles/content-manager.css';

// Types
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card className="h-100 border-0 shadow-sm">
    <Card.Body className="d-flex align-items-center">
      <div className="flex-shrink-0 me-3">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{
            width: '60px',
            height: '60px',
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="flex-grow-1">
        <h3 className="mb-1 fw-bold" style={{ color: color }}>
          {value.toLocaleString()}
        </h3>
        <h6 className="mb-1 text-muted">{title}</h6>
        {subtitle && <small className="text-muted">{subtitle}</small>}
      </div>
    </Card.Body>
  </Card>
);

const Dashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState<CurriculumStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await chapterService.getCurriculumStatistics();
        setData(response);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
const gradeNames: Record<number, string> = {
    0: 'Lớp 10',
    1: 'Lớp 11',
    2: 'Lớp 12',
};
  // Prepare chart data
  const gradeChartData = data?.chapter_statistics.map((stat: ChapterStatByGrade) => ({
    name : `${gradeNames[stat.grade]}`,
    chapters: stat.total_chapters,
    lessons: stat.total_lessons,
    questions: stat.total_questions,
  })) || [];

  const difficultyChartData: ChartData[] = data?.question_statistics.map((stat: DifficultyStat) => ({
    name: stat.difficulty === 0 ? 'Dễ' : stat.difficulty === 1 ? 'Trung bình' : 'Khó',
    value: stat.total_questions,
    color: stat.difficulty === 0 ? '#28a745' : stat.difficulty === 1 ? '#ffc107' : '#dc3545',
  })) || [];

  const lessonTypeData: ChartData[] = [
    {
      name: 'Có slide',
      value: data?.total_has_slide_lesson || 0,
      color: '#17a2b8',
    },
    {
      name: 'Có simulation',
      value: data?.total_has_simulation_lesson || 0,
      color: '#6f42c1',
    },
    {
      name: 'Khác',
      value: (data?.total_lessons || 0) - (data?.total_has_slide_lesson || 0) - (data?.total_has_simulation_lesson || 0),
      color: '#6c757d',
    },
  ].filter(item => item.value > 0);

  const questionTypeData: ChartData[] = [
    {
      name: 'Có simulation',
      value: data?.total_has_simulation_question || 0,
      color: '#fd7e14',
    },
    {
      name: 'Thường',
      value: (data?.total_questions || 0) - (data?.total_has_simulation_question || 0),
      color: '#20c997',
    },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <ContentManagerSidebar onCollapse={setSidebarCollapsed} />
        <ContentManagerNavbar collapsed={sidebarCollapsed} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} bg-gray-50 min-h-screen`}>
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Đang tải...</span>
            </Spinner>
            <p className="mt-3 text-muted">Đang tải dữ liệu dashboard...</p>
          </div>
        </main>
        <ContentManagerFooter collapsed={sidebarCollapsed} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <ContentManagerSidebar onCollapse={setSidebarCollapsed} />
        <ContentManagerNavbar collapsed={sidebarCollapsed} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} bg-gray-50 min-h-screen`}>
          <div className="container-fluid py-4">
            <Alert variant="danger">
              <Alert.Heading>Lỗi!</Alert.Heading>
              <p>{error}</p>
            </Alert>
          </div>
        </main>
        <ContentManagerFooter collapsed={sidebarCollapsed} />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <ContentManagerSidebar onCollapse={setSidebarCollapsed} />
      <ContentManagerNavbar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} bg-gray-50 min-h-screen`}>
        <div className="container-fluid py-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Dashboard Quản lý Nội dung</h2>
              <p className="text-muted mb-0">Tổng quan về hệ thống giáo dục GeoPhy</p>
            </div>
            <Badge bg="primary" className="fs-6 px-3 py-2">
              Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
            </Badge>
          </div>

          {/* Overview Cards */}
          <Row className="g-3 mb-4">
            <Col lg={3} md={6}>
              <StatCard
                title="Tổng chương"
                value={data?.total_chapters || 0}
                icon={<FaBookOpen size={24} />}
                color="#0d6efd"
              />
            </Col>
            <Col lg={3} md={6}>
              <StatCard
                title="Tổng bài học"
                value={data?.total_lessons || 0}
                icon={<FaFileAlt size={24} />}
                color="#198754"
              />
            </Col>
            <Col lg={3} md={6}>
              <StatCard
                title="Tổng câu hỏi"
                value={data?.total_questions || 0}
                icon={<FaQuestionCircle size={24} />}
                color="#dc3545"
              />
            </Col>
            <Col lg={3} md={6}>
              <StatCard
                title="Tỉ lệ hoàn thành"
                value={Math.round(((data?.total_lessons || 0) / Math.max((data?.total_chapters || 1) * 3, 1)) * 100)}
                icon={<FaChartBar size={24} />}
                color="#0dcaf0"
                subtitle="bài học/chương"
              />
            </Col>
          </Row>

          {/* Charts Row 1 */}
          <Row className="g-3 mb-4">
            <Col lg={8}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 fw-bold">Thống kê theo lớp</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="chapters" fill="#0d6efd" name="Chương" />
                      <Bar dataKey="lessons" fill="#198754" name="Bài học" />
                      <Bar dataKey="questions" fill="#dc3545" name="Câu hỏi" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 fw-bold">Phân bố độ khó câu hỏi</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={difficultyChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {difficultyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts Row 2 */}
          <Row className="g-3 mb-4">
            <Col lg={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 fw-bold">Loại bài học</h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={lessonTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {lessonTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex justify-content-center gap-4 mt-3">
                    <div className="d-flex align-items-center">
                      <FaSlideshare className="text-info me-2" />
                      <small>Có slide</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <FaGamepad className="text-purple me-2" />
                      <small>Có simulation</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 fw-bold">Loại câu hỏi</h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={questionTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {questionTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex justify-content-center gap-4 mt-3">
                    <div className="d-flex align-items-center">
                      <FaGamepad className="text-warning me-2" />
                      <small>Có simulation</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <FaQuestionCircle className="text-success me-2" />
                      <small>Thường</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Summary Cards */}
          <Row className="g-3">
            <Col lg={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <FaGraduationCap size={48} className="text-primary" />
                  </div>
                  <h4 className="fw-bold text-primary mb-2">
                    {data?.chapter_statistics.length || 0}
                  </h4>
                  <p className="text-muted mb-0">Lớp học có nội dung</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <FaSlideshare size={48} className="text-info" />
                  </div>
                  <h4 className="fw-bold text-info mb-2">
                    {data?.total_has_slide_lesson || 0}
                  </h4>
                  <p className="text-muted mb-0">Bài học có slide</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <FaGamepad size={48} className="text-warning" />
                  </div>
                  <h4 className="fw-bold text-warning mb-2">
                    {data?.total_has_simulation_lesson || 0}
                  </h4>
                  <p className="text-muted mb-0">Bài học có simulation</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </main>
      <ContentManagerFooter collapsed={sidebarCollapsed} />
    </div>
  );
};

export default Dashboard;