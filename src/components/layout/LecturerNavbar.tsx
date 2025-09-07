import React, { useEffect } from 'react';
import { Navbar, Container, Button, Dropdown } from 'react-bootstrap';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import '../../styles/content-manager.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, isLoggedIn } from '../../utils';

interface LecturerNavbarProps {
  collapsed?: boolean;
}

const LecturerNavbar: React.FC<LecturerNavbarProps> = ({ }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = localStorage.getItem('username') || 'Lecturer';
  useEffect(() => {
    if (!isLoggedIn()) {
      logout();
      navigate('/login', { state: { from: location } });
    }
  }, [navigate, location]);

  const handleLogout = () => {
    logout();
    navigate('/login', { state: { from: location } });
  };

  return (
    <Navbar
      bg="white"
      className="content-manager-navbar border-bottom shadow-sm"
    >
      <Container fluid>
        {/* Right Side Items */}
        <div className="ms-auto d-flex align-items-center">
          {/* Notifications */}
          {/* <Button
            variant="link"
            className="text-muted position-relative me-3"
            style={{ textDecoration: 'none' }}
          >
            <FaBell size={18} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}>
              3
            </span>
          </Button> */}

          {/* User Profile Dropdown */}
          <Dropdown align="end" className="profile-dropdown" >
            <Dropdown.Toggle
              as="div"
              id="dropdown-avatar"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', border: 'none', background: 'none', boxShadow: 'none' }}
            >
              <div className="d-flex align-items-center">
                <div className="me-2">
                  <div className="avatar-circle" style={{ width: '32px', height: '32px' }}>
                    <FaUserCircle size={14} />
                  </div>
                </div>
                <div className="d-none d-md-block">
                  <div className="fw-medium">{user}</div>
                  <small className="text-muted">Giáo viên</small>
                </div>
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => navigate("/lecturer/profile")}>
                Profile
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>
    </Navbar>
  );
};

export default LecturerNavbar; 