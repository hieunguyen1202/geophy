import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaChartLine,
  FaUserShield,
  FaChalkboardTeacher,
  FaGraduationCap,
} from 'react-icons/fa';
import { useLocation, Link as ReactRouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminFooter from '../../components/admin/AdminFooter';
import { listMenuAdmin } from '../../config';
import { getUserStatusStatistics } from '../../services/userService';

// ====== Types theo response thật sự của service (return response.data) ======
type ByRoleItem = { role: number; active: number; inactive: number };
type UserStatusData = { overall: { active: number; inactive: number }; by_role: ByRoleItem[] };
type ApiResponse = { message?: string[]; data: UserStatusData };

// ====== Helper Functions ======
const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0.0';
  return ((value / total) * 100).toFixed(1);
};

const getRoleName = (role: number): string => {
  switch (role) {
    case 1: return 'Quản trị viên';
    case 2: return 'Giáo viên';
    case 3: return 'Học sinh';
    default: return `Vai trò ${role}`;
  }
};

const getRoleIcon = (role: number) => {
  switch (role) {
    case 1: return <FaUserShield size={24} />;
    case 2: return <FaChalkboardTeacher size={24} />;
    case 3: return <FaGraduationCap size={24} />;
    default: return <FaUsers size={24} />;
  }
};

// ====== UI Components ======
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card className="h-100 shadow-sm border-0">
    <Card.Body>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <p className="text-muted mb-1 small">{title}</p>
          <h3 className="mb-1 fw-bold" style={{ color }}>
            {safeNumber(value).toLocaleString()}
          </h3>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
        <div style={{ color, opacity: 0.8, fontSize: '2rem' }}>{icon}</div>
      </div>
    </Card.Body>
  </Card>
);

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string }> = ({
  data,
  title,
}) => {
  const total = data.reduce((sum, item) => sum + safeNumber(item.value), 0);
  let cumulativePercentage = 0;
  const radius = 80;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  const createDashArray = (percentage: number) => {
    const strokeLength = (percentage / 100) * circumference;
    return `${strokeLength} ${circumference}`;
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <h6 className="mb-3 fw-bold">{title}</h6>
        <div className="d-flex align-items-center justify-content-between">
          <div className="position-relative d-inline-flex">
            <svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
              {/* Background circle */}
              <circle
                cx={radius + strokeWidth / 2}
                cy={radius + strokeWidth / 2}
                r={radius}
                fill="transparent"
                stroke="#f0f0f0"
                strokeWidth={strokeWidth}
              />
              {/* Data circles */}
              {total > 0 &&
                data.map((item, index) => {
                  const percentage = (safeNumber(item.value) / total) * 100;
                  const dashArray = createDashArray(percentage);
                  const dashOffset = -((cumulativePercentage / 100) * circumference);
                  cumulativePercentage += percentage;

                  return (
                    <circle
                      key={index}
                      cx={radius + strokeWidth / 2}
                      cy={radius + strokeWidth / 2}
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
                    />
                  );
                })}
            </svg>
            <div className="position-absolute top-50 start-50 translate-middle text-center">
              <h5 className="mb-0 fw-bold">{total.toLocaleString()}</h5>
              <small className="text-muted">Tổng</small>
            </div>
          </div>
          <div>
            {data.map((item, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: item.color,
                    borderRadius: '50%',
                    marginRight: 8,
                  }}
                />
                <small className="text-muted">
                  {item.label}: <strong>{safeNumber(item.value).toLocaleString()}</strong>
                </small>
              </div>
            ))}
          </div>
        </div>
        {total === 0 && <small className="text-muted d-block mt-2">Chưa có dữ liệu người dùng</small>}
      </Card.Body>
    </Card>
  );
};

const RoleBarChart: React.FC<{ data: ByRoleItem[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="h-100">
        <Card.Body>
          <h6 className="mb-3 fw-bold">Trạng thái theo vai trò</h6>
          <small className="text-muted">Chưa có người dùng theo vai trò</small>
        </Card.Body>
      </Card>
    );
  }

  const maxValue = Math.max(1, ...data.map((item) => safeNumber(item.active) + safeNumber(item.inactive)));

  return (
    <Card className="h-100">
      <Card.Body>
        <h6 className="mb-3 fw-bold">Trạng thái theo vai trò</h6>
        <div className="mt-2">
          {data.map((item, index) => {
            const active = safeNumber(item.active);
            const inactive = safeNumber(item.inactive);
            const total = active + inactive;
            const activePercentage = maxValue > 0 ? (active / maxValue) * 100 : 0;
            const inactivePercentage = maxValue > 0 ? (inactive / maxValue) * 100 : 0;

            return (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="fw-medium">{getRoleName(item.role)}</small>
                  <small className="text-muted"><strong>{total.toLocaleString()}</strong> người dùng</small>
                </div>
                <div
                  className="position-relative rounded"
                  style={{ height: 24, background: '#f8f9fa', border: '1px solid #e9ecef' }}
                >
                  {activePercentage > 0 && (
                    <div
                      className="position-absolute top-0 start-0 h-100 bg-success rounded-start"
                      style={{ width: `${activePercentage}%` }}
                    />
                  )}
                  {inactivePercentage > 0 && (
                    <div
                      className="position-absolute top-0 bg-danger h-100"
                      style={{
                        left: `${activePercentage}%`,
                        width: `${inactivePercentage}%`,
                        borderRadius: activePercentage > 0 ? '0 4px 4px 0' : '4px'
                      }}
                    />
                  )}
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle me-1" style={{ width: 8, height: 8, backgroundColor: '#198754' }} />
                    <small>Kích hoạt: <strong>{active.toLocaleString()}</strong></small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle me-1" style={{ width: 8, height: 8, backgroundColor: '#dc3545' }} />
                    <small>Chưa kích hoạt: <strong>{inactive.toLocaleString()}</strong></small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

// ====== Main Dashboard Component ======
const Dashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const [data, setData] = useState<UserStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiMessages, setApiMessages] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Function to convert to UTC +7
        const toUTCPlus7 = (date) => {
          const utcDate = new Date(date);
          return new Date(utcDate.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours
        };

        // Setting up the dates
        const endDate = toUTCPlus7(new Date()); // Current date in UTC +7
        const startDate = toUTCPlus7(new Date());
        startDate.setDate(startDate.getDate() - 30); // 30 days ago in UTC +7

        // Fetch user status statistics
        const response: ApiResponse = await getUserStatusStatistics({
          startDate,
          endDate,
        } as any);

        console.log('API Response:', response); // Debug log

        setApiMessages(response?.message ?? []);
        setData(response?.data ?? { overall: { active: 0, inactive: 0 }, by_role: [] });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <AdminSidebar onCollapse={setSidebarCollapsed} />
        <AdminNavbar collapsed={sidebarCollapsed} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Đang tải...</span>
            </Spinner>
            <p className="mt-3 text-muted">Đang tải dữ liệu dashboard...</p>
          </div>
        </main>
        <AdminFooter collapsed={sidebarCollapsed} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <AdminSidebar onCollapse={setSidebarCollapsed} />
        <AdminNavbar collapsed={sidebarCollapsed} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Alert variant="danger" className="m-3">
            <Alert.Heading>Lỗi tải dữ liệu</Alert.Heading>
            <p>{error}</p>
          </Alert>
        </main>
        <AdminFooter collapsed={sidebarCollapsed} />
      </div>
    );
  }

  // Process data with safe number handling
  const overall = data?.overall ?? { active: 0, inactive: 0 };
  const byRole = data?.by_role ?? [];

  const activeUsers = safeNumber(overall.active);
  const inactiveUsers = safeNumber(overall.inactive);
  const totalUsers = activeUsers + inactiveUsers;
  const activePercentage = formatPercentage(activeUsers, totalUsers);
  const inactivePercentage = formatPercentage(inactiveUsers, totalUsers);

  const overallChartData = [
    { label: 'Kích hoạt', value: activeUsers, color: '#198754' },
    { label: 'Chưa kích hoạt', value: inactiveUsers, color: '#dc3545' },
  ];

  const topActiveRole = byRole.length > 0
    ? byRole.reduce((prev, current) =>
      safeNumber(prev.active) > safeNumber(current.active) ? prev : current
    )
    : null;

  return (
    <div className="d-flex flex-column min-vh-100">
      <AdminSidebar onCollapse={setSidebarCollapsed} />
      <AdminNavbar collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="mb-6 mt-2">
          <Breadcrumbs aria-label="breadcrumb" className="mb-2">
            <Link component={ReactRouterLink} to="/admin/dashboard" color="inherit" underline="hover">
              Quản trị viên
            </Link>
            <Link
              component={ReactRouterLink}
              to={location.pathname}
              color="text.primary"
              underline="hover"
              aria-current="page"
            >
              {listMenuAdmin.find((item) => item.path === location.pathname)?.name || 'Bảng điều khiển'}
            </Link>
          </Breadcrumbs>
        </div>


        {/* Overview Cards */}
        <Row className="g-3 mb-4">
          <Col lg={3} md={6}>
            <StatCard
              title="Tổng người dùng"
              value={totalUsers}
              icon={<FaUsers />}
              color="#0d6efd"
            />
          </Col>
          <Col lg={3} md={6}>
            <StatCard
              title="Người dùng Kích hoạt"
              value={activeUsers}
              icon={<FaUserCheck />}
              color="#198754"
              subtitle={`${activePercentage}% tổng số`}
            />
          </Col>
          <Col lg={3} md={6}>
            <StatCard
              title="Người dùng Chưa kích hoạt"
              value={inactiveUsers}
              icon={<FaUserTimes />}
              color="#dc3545"
              subtitle={`${inactivePercentage}% tổng số`}
            />
          </Col>
          <Col lg={3} md={6}>
            <StatCard
              title="Tỉ lệ Kích hoạt"
              value={parseFloat(activePercentage)}
              icon={<FaChartLine />}
              color="#0dcaf0"
              subtitle="phần trăm"
            />
          </Col>
        </Row>

        {/* Charts */}
        <Row className="g-3 mb-4">
          <Col lg={6}>
            <DonutChart data={overallChartData} title="Trạng thái chung" />
          </Col>
          <Col lg={6}>
            <RoleBarChart data={byRole} />
          </Col>
        </Row>

        {/* Role Details */}
        <h5 className="mb-3 fw-bold">Phân tích theo vai trò</h5>
        <Row className="g-3">
          {byRole.map((roleData, index) => {
            const active = safeNumber(roleData.active);
            const inactive = safeNumber(roleData.inactive);
            const total = active + inactive;
            const activeRate = formatPercentage(active, total);

            return (
              <Col key={index} lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="text-primary me-2">{getRoleIcon(roleData.role)}</div>
                      <h6 className="mb-0 fw-bold">{getRoleName(roleData.role)}</h6>
                    </div>

                    <div className="mb-3">
                      <h4 className="mb-0 fw-bold text-primary">{total.toLocaleString()}</h4>
                      <small className="text-muted">Tổng số người dùng</small>
                    </div>

                    <div className="d-flex justify-content-between mb-3">
                      <Badge bg="success" className="me-1">
                        {active.toLocaleString()} Kích hoạt
                      </Badge>
                      <Badge bg="danger">
                        {inactive.toLocaleString()} Chưa kích hoạt
                      </Badge>
                    </div>

                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Tỉ lệ Kích hoạt</small>
                        <small className="fw-bold">{activeRate}%</small>
                      </div>
                      <ProgressBar
                        now={parseFloat(activeRate)}
                        variant="success"
                        style={{ height: 8 }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}

          {byRole.length === 0 && (
            <Col xs={12}>
              <Card className="h-100 border-0">
                <Card.Body className="text-center text-muted py-5">
                  <FaUsers size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">Không có dữ liệu vai trò</p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Quick Insights */}
        <Card className="mt-4 bg-light border-0">
          <Card.Body>
            <h6 className="mb-3 fw-bold text-primary">📊 Nhận xét nhanh</h6>
            <Row>
              <Col md={6}>
                <p className="text-muted mb-2">
                  🎯 <strong>Vai trò Kích hoạt nhiều nhất:</strong>&nbsp;
                  {topActiveRole ? getRoleName(topActiveRole.role) : 'Chưa có dữ liệu'}
                  {topActiveRole && ` (${safeNumber(topActiveRole.active)} người)`}
                </p>
              </Col>
              <Col md={6}>
                <p className="text-muted mb-2">
                  📈 <strong>Tỉ lệ Kích hoạt chung:</strong> {activePercentage}%
                </p>
              </Col>
              <Col md={6}>
                <p className="text-muted mb-2">
                  👥 <strong>Tổng số vai trò:</strong> {byRole.length} vai trò
                </p>
              </Col>
              <Col md={6}>
                <p className="text-muted mb-0">
                  🔄 <strong>Cập nhật:</strong> 30 ngày gần đây
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </main>
      <AdminFooter collapsed={sidebarCollapsed} />
    </div>
  );
};

export default Dashboard;