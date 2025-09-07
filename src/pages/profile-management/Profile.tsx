import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Avatar, CircularProgress, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton
} from '@mui/material';
import { getProfile } from '../../services/profileService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import type { BaseListMenu } from '../../types';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaTrophy, FaEnvelope, FaPhone, FaBirthdayCake, FaSchool, FaVenusMars, FaEdit, FaKey } from 'react-icons/fa';
import Tooltip from '@mui/material/Tooltip';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { Snackbar } from '@mui/material';
import { changePassword } from '../../services/userService';
import { updateProfile } from '../../services/profileService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

interface LandingPageProps {
  listMenuUser: BaseListMenu[];
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC<LandingPageProps> = ({ listMenuUser }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    dob: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    getProfile(token)
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  const handleOpenEditModal = () => {
    setEditForm({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      mobile: profile.mobile || '',
      dob: profile.dob ? profile.dob.split('T')[0] : '', // format YYYY-MM-DD
    });
    setOpenEditModal(true);
  };
  const handleUpdateProfile = async () => {
    // Validate first name
    if (!editForm.first_name.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập Họ.', severity: 'error' });
      return;
    }

    // Validate last name
    if (!editForm.last_name.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập Tên.', severity: 'error' });
      return;
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    if (!phoneRegex.test(editForm.mobile)) {
      setSnackbar({ open: true, message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10 số.', severity: 'error' });
      return;
    }

    // Validate date of birth (cannot be in the future)
    const dobDate = new Date(editForm.dob);
    if (!editForm.dob || dobDate > new Date()) {
      setSnackbar({ open: true, message: 'Ngày sinh không hợp lệ.', severity: 'error' });
      return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
      setSnackbar({ open: true, message: 'Vui lòng đăng nhập lại.', severity: 'error' });
      return;
    }

    try {
      const response = await updateProfile(token, editForm);

      // Refresh profile data
      const updatedProfile = await getProfile(token);
      setProfile(updatedProfile);

      setOpenEditModal(false);

      // Handle response message array
      const message = Array.isArray(response.message)
        ? response.message.join('\n')
        : response.message || 'Cập nhật hồ sơ thành công!';

      setSnackbar({ open: true, message, severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Cập nhật thất bại', severity: 'error' });
    }
  };


  const handlePasswordChange = (field: keyof PasswordForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setPasswordError(null);
  };
  const handleChangePassword = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      setSnackbar({ open: true, message: 'Vui lòng đăng nhập lại.', severity: 'error' });
      return;
    }

    try {
      await changePassword(token, passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setOpenPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setSnackbar({ open: true, message: 'Đổi mật khẩu thành công!', severity: 'success' });
    } catch (error: any) {
      const errorMessages = [
        ...(Array.isArray(error.message) ? error.message : []),
        ...(Array.isArray(error.messages) ? error.messages : [])
      ];

      if (errorMessages.length > 0) {
        setSnackbar({ open: true, message: errorMessages.join('\n'), severity: 'error' }); // join all messages
      } else {
        setSnackbar({ open: true, message: 'Đổi mật khẩu thất bại', severity: 'error' });
      }
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-gray-100">
      <CircularProgress size={60} className="text-primary" />
    </div>
  );
  if (error) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-gray-100">
      <Alert severity="error" className="w-100 max-w-md mx-4">{error}</Alert>
    </div>
  );
  if (!profile) return null;
  const role = localStorage.getItem("role");
  return (
    <div className="min-vh-100 bg-gradient-to-br from-blue-50 to-gray-100 d-flex flex-column">
      <Navbar listMenuUser={listMenuUser} />
      <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5 px-3">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <Card className="shadow-xl border-0 rounded-4 overflow-hidden">
                <div className="bg-primary bg-gradient text-white text-center py-4 position-relative">
                  <Typography variant="h4" className="fw-bold ">Hồ Sơ Người Dùng</Typography>
                  <Tooltip title="Chỉnh sửa hồ sơ" placement="left">
                    <Button
                      variant="contained"
                      color="secondary"
                      className="position-absolute top-0 end-0 m-3 p-2 rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                      style={{ minWidth: 0, width: 44, height: 44 }}
                      onClick={handleOpenEditModal} // ✅ open modal instead of redirect
                    >
                      <FaEdit />
                    </Button>
                  </Tooltip>
                </div>
                <CardContent className="p-6">
                  <div className="row align-items-center flex-wrap">
                    <div className="col-12 col-md-5 d-flex flex-column align-items-center mb-4 mb-md-0">
                      <Avatar
                        className="bg-primary mb-3 border-4 border-white shadow"
                        sx={{ width: 120, height: 120, fontSize: '3rem', border: '4px solid #1976d2' }}
                      >
                        {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : profile.email ? profile.email.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      <Typography variant="h5" className="fw-bold text-gray-800 mb-1">
                        {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.user_name || profile.email}
                      </Typography>
                      {/* <Typography variant="body2" className="text-muted mb-2">
                        {profile.email}
                      </Typography> */}
                      {/* <span className="badge bg-secondary">Mã người dùng: {profile.id}</span> */}
                    </div>
                    <div className="col-12 col-md-7">
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center bg-light rounded-3 p-3 mb-2 shadow-sm">
                            <FaEnvelope className="me-3 text-primary" />
                            <span className="fw-semibold text-gray-700 flex-grow-1">Email</span>
                            <span className="text-gray-900">{profile.email}</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center bg-light rounded-3 p-3 mb-2 shadow-sm">
                            <FaPhone className="me-3 text-primary" />
                            <span className="fw-semibold text-gray-700 flex-grow-1">Số điện thoại</span>
                            <span className="text-gray-900">{profile.mobile || 'Không có'}</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center bg-light rounded-3 p-3 mb-2 shadow-sm">
                            <FaBirthdayCake className="me-3 text-primary" />
                            <span className="fw-semibold text-gray-700 flex-grow-1">Ngày sinh</span>
                            <span className="text-gray-900">{profile.dob ? new Date(profile.dob).toLocaleDateString('vi-VN') : 'Không có'}</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center bg-light rounded-3 p-3 mb-2 shadow-sm">
                            <FaVenusMars className="me-3 text-primary" />
                            <span className="fw-semibold text-gray-700 flex-grow-1">Giới tính</span>
                            <span className="text-gray-900">{profile.gender === 0 ? 'Nam' : profile.gender === 1 ? 'Nữ' : 'Khác'}</span>
                          </div>
                        </div>
                        <div className="col-12">
                          {String(role) === 'student' ? (
                            <div className="d-flex align-items-center bg-light rounded-3 p-3 mb-2 shadow-sm">
                              <FaSchool className="me-3 text-primary" />
                              <span className="fw-semibold text-gray-700 flex-grow-1">Khối lớp</span>
                              <span className="text-gray-900">
                                {profile.grade === 0 ? 'Lớp 10' :
                                  profile.grade === 1 ? 'Lớp 11' :
                                    profile.grade === 2 ? 'Lớp 12' :
                                      'Khác'}
                              </span>
                            </div>
                          ) : (
                            <div className="d-flex align-items-center bg-light rounded-3 p-3 mb-2 shadow-sm">
                              <span className="fw-semibold text-gray-700 flex-grow-1">Môn học</span>
                              <span className="text-gray-900">
                                {profile.subject || 'Không có môn học'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="col-12 mt-4">
                          <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            startIcon={<FaKey />}
                            onClick={() => setOpenPasswordModal(true)}
                            className="py-2 text-black flex-grow-1 border-2 border-primary hover:bg-primary hover:text-black transition duration-200"
                          >
                            Đổi Mật Khẩu
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer listMenuUser={listMenuUser} />
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth className='border-2'
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '2px solid gray',
          },
        }}>
        <DialogTitle className="bg-primary text-white">Chỉnh Sửa Hồ Sơ</DialogTitle>
        <DialogContent className="mt-3">
          <TextField
            fullWidth
            label="Họ"
            value={editForm.first_name}
            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            className="mb-3"
          />
          <TextField
            fullWidth
            label="Tên"
            value={editForm.last_name}
            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            className="mb-3"
          />
          <TextField
            fullWidth
            label="Số điện thoại"
            value={editForm.mobile}
            onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
            className="mb-3"
          />

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <DatePicker
              label="Ngày sinh"
              value={editForm.dob ? new Date(editForm.dob) : null}
              onChange={(date) => {
                setEditForm({ ...editForm, dob: date ? date.toISOString().split('T')[0] : '' });
              }}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  className: 'mb-3',
                  error: !!editForm.dob && new Date(editForm.dob) > new Date(), // show error if invalid
                  helperText:
                    editForm.dob && new Date(editForm.dob) > new Date()
                      ? 'Ngày sinh không hợp lệ'
                      : '',
                },
              }}
            />
          </LocalizationProvider>
        </DialogContent>

        <DialogActions className="p-3">
          <Button variant="outlined" onClick={() => setOpenEditModal(false)} className="me-2 text-black">
            Hủy
          </Button>
          <Button variant="contained" className="bg-primary" onClick={handleUpdateProfile}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog
        open={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '2px solid gray',
          },
        }}
      >
        <DialogTitle className="bg-primary text-white">
          <div className="d-flex align-items-center">
            <FaKey className="me-2" />
            Đổi Mật Khẩu
          </div>
        </DialogTitle>
        <DialogContent className="mt-4">
          {passwordError && (
            <Alert severity="error" className="mb-3">
              {passwordError}
            </Alert>
          )}
          <div className="mb-3 mt-2">
            <TextField
              fullWidth
              label="Mật khẩu hiện tại"
              type={showPassword.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange('currentPassword')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    edge="end"
                  >
                    {showPassword.current ? <MdVisibilityOff /> : <MdVisibility />}
                  </IconButton>
                ),
              }}
            />
          </div>
          <div className="mb-3 mt-2">
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type={showPassword.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={handlePasswordChange('newPassword')}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    edge="end"
                  >
                    {showPassword.new ? <MdVisibilityOff /> : <MdVisibility />}
                  </IconButton>
                ),
              }}
            />
          </div>
          <div className="mb-3 mt-2">
            <TextField
              fullWidth
              label="Xác nhận mật khẩu mới"
              type={showPassword.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    edge="end"
                  >
                    {showPassword.confirm ? <MdVisibilityOff /> : <MdVisibility />}
                  </IconButton>
                ),
              }}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-3">
          <Button
            variant="outlined"
            onClick={() => setOpenPasswordModal(false)}
            className="me-2 text-black"
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            className="bg-primary"
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: { xs: 70, sm: 70 } }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="standard"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </div>
  );
};

export default Profile;