import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import type { BaseListMenu } from '../../types';
import '../../styles/landing.css';
import { Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountCircle, Logout, Functions, Science, ExpandMore } from '@mui/icons-material';
import Divider from '@mui/material/Divider';
import { isLoggedIn, fetchUserRole } from '../../utils';
import School from '@mui/icons-material/School';
import History from '@mui/icons-material/History';
import type { SvgIconProps } from '@mui/material/SvgIcon';

interface NavbarProps {
  listMenuUser?: BaseListMenu[];
}

type IconComponent = React.ComponentType<SvgIconProps>;

interface ResourceDropdownItemProps {
  icon: IconComponent;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

const ResourceDropdownItem: React.FC<ResourceDropdownItemProps & { style?: React.CSSProperties }> = ({ icon: Icon, title, description, onClick, color, style }) => (
  <div
    onClick={onClick}
    className="d-flex align-items-start p-3 resource-item"
    style={{
      cursor: 'pointer',
      borderRadius: '8px',
      margin: '4px 8px',
      transition: 'all 0.2s ease',
      border: '1px solid transparent',
      ...style
    }}
  >
    <div
      className="me-3 d-flex align-items-center justify-content-center"
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: color + '20',
        flexShrink: 0
      }}
    >
      <Icon style={{ color: color, fontSize: '24px' }} />
    </div>
    <div className="flex-grow-1">
      <div className="fw-bold mb-1" style={{ color: '#1a1a1a', fontSize: '16px' }}>
        {title}
      </div>
      <div style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.4' }}>
        {description}
      </div>
    </div>
  </div>
);

const NavigationBar: React.FC<NavbarProps> = ({ listMenuUser = [] }) => {
  const [isLoggedInState, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);
  const [activeResourceIdx, setActiveResourceIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const storedUsername = localStorage.getItem('username');
      const isAuthenticated = isLoggedIn();

      if (!isAuthenticated) {
        setIsLoggedIn(false);
        setUsername('');

        if (location.pathname !== '/' && !location.pathname.includes('/login')) {
          navigate('/login', { state: { from: location } });
        }
      } else {
        setIsLoggedIn(true);
        setUsername(storedUsername || '');
        fetchUserRole(localStorage.getItem('userToken') || '');
      }
    };

    checkAuthAndRedirect();
  }, [location, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/');
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const resourceItems = [
    {
      icon: Functions,
      title: 'Toán học',
      description: 'Học Hình học tương tác, mô hình 3D, và các bài kiểm tra gamification giúp hiểu sâu không gian và hình học.',
      path: '/resource/math',
      color: '#3b82f6'
    },
    {
      icon: Science,
      title: 'Vật lý',
      description: 'Khám phá Vật lý qua mô phỏng trực quan, thí nghiệm ảo, và bảng xếp hạng học tập.',
      path: '/resource/physics',
      color: '#10b981'
    }
  ];

  return (
    <Navbar bg="white" expand="md" className="landing-navbar">
      <Container>
        <Navbar.Brand href="/" className="text-primary fw-bold">
          GeoPhy
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex flex-column flex-md-row align-items-center">
            <div className="d-flex flex-column flex-md-row align-items-center w-100 w-md-auto mb-3 mb-md-0">
              {listMenuUser.map((item, index) => (
                item.name === 'Tài nguyên' ? (
                  <div key={index} className="position-relative">
                    <Nav.Link
                      className="text-primary py-2 py-md-0 d-flex align-items-center"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowResourceDropdown((prev) => !prev)}
                    >
                      Tài nguyên
                      <ExpandMore
                        fontSize="small"
                        sx={{
                          ml: 0.5,
                          transition: 'transform 0.2s',
                          transform: showResourceDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: showResourceDropdown ? '#3b82f6' : '#6b7280',
                          width: 18,
                          height: 18,
                        }}
                      />
                    </Nav.Link>
                    {showResourceDropdown && (
                      <div
                        className="position-absolute"
                        style={{
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 1000,
                          minWidth: '400px',
                          backgroundColor: 'white',
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          border: '1px solid #e5e7eb',
                          marginTop: '8px'
                        }}
                      >
                        {/* Arrow pointer */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '12px',
                            height: '12px',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderBottom: 'none',
                            borderRight: 'none',
                            rotate: '45deg'
                          }}
                        ></div>
                        <div className="p-2">
                          {resourceItems.map((resource, idx) => (
                            <div
                              key={idx}
                              onMouseEnter={() => setActiveResourceIdx(idx)}
                              onMouseLeave={() => setActiveResourceIdx(null)}
                            >
                              <ResourceDropdownItem
                                icon={resource.icon}
                                title={resource.title}
                                description={resource.description}
                                color={resource.color}
                                onClick={() => {
                                  setShowResourceDropdown(false);
                                  navigate(resource.path);
                                }}
                                style={activeResourceIdx === idx ? {
                                  backgroundColor: '#f8f9ff',
                                  borderColor: '#e3e8ff',
                                  transform: 'translateY(-1px)'
                                } : {}}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Nav.Link
                    key={index}
                    href={item.path}
                    className="text-primary py-2 py-md-0"
                  >
                    {item.name}
                  </Nav.Link>
                )
              ))}
            </div>
            <div className="d-flex flex-row align-items-center ms-3">
              {isLoggedInState ? (
                <>
                  <Button
                    id="basic-button"
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                    variant="link"
                    className="text-decoration-none p-0"
                  >
                    <Avatar>{username.charAt(0).toUpperCase()}</Avatar>
                  </Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'basic-button',
                      sx: { padding: 1, minWidth: 180 }
                    }}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        minWidth: 180,
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1.5,
                          fontSize: 15,
                          borderRadius: 1,
                          transition: 'background 0.2s',
                        },
                        '& .MuiMenuItem-root:hover': {
                          backgroundColor: 'rgba(243, 112, 33, 0.08)',
                        },
                      }
                    }}
                  >
                    <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                      <AccountCircle sx={{ mr: 1 }} fontSize="small" />
                      Hồ sơ
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { handleClose(); navigate('/student/classes'); }}>
                      <School sx={{ mr: 1 }} fontSize="small" />
                      Lớp học của tôi
                    </MenuItem>
                    <Divider />

                    <MenuItem onClick={() => { handleClose(); navigate('/student-test-history'); }}>
                      <History sx={{ mr: 1 }} fontSize="small" />
                      Lịch sử luyện tập
                    </MenuItem>
                    <Divider />

                    <MenuItem onClick={handleLogout}>
                      <Logout sx={{ mr: 1 }} fontSize="small" />
                      Đăng xuất
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    className="px-3 py-0.5 text-sm me-2"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => navigate('/login', { state: { from: location } })}
                  >
                    Đăng Nhập
                  </Button>
                </>
              )}
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;