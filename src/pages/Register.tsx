import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert, type SnackbarCloseReason } from '@mui/material';
import authService from "../services/authService";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [grade, setGrade] = useState<number>(1);
  const [gender, setGender] = useState<number>(1);
  const [dob, setDob] = useState<Date | null>(null);
  const [role] = useState<number>(3);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const otc = localStorage.getItem("otc");
  const navigate = useNavigate();

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // Format: yyyy-MM-dd
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await authService.register({
        otc: otc ? otc : '',
        first_name: firstName,
        last_name: lastName,
        mobile,
        gender,
        dob: formatDate(dob), 
        role,
      });

        // Lưu token
              localStorage.setItem("userToken", response.accessToken);
              localStorage.setItem("refreshToken", response.refreshToken);

      setSnackbarSeverity('success');
      setSnackbarMessage('Tạo thông tin cá nhân thành công');
      setOpenSnackbar(true);
      setTimeout(() => navigate('/'), 2000);
      localStorage.removeItem("otc");
    } catch (error: any) {
      console.error('Registration failed:', error);
      const messages =
        error.response?.data?.messages ||
        error.response?.data?.message ||
        error.response?.data?.detailMessage;

      const messageText = Array.isArray(messages)
        ? messages.join(',\n')
        : messages || 'Đăng ký thất bại. Vui lòng thử lại.';

      setSnackbarSeverity('error');
      setSnackbarMessage(messageText);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-2 py-2 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 opacity-60"></div>
      <div className="absolute w-32 h-32 bg-blue-500 rounded-full opacity-20 top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute w-40 h-40 bg-white rounded-lg opacity-10 top-1/3 right-1/4 transform rotate-45"></div>
      <div className="absolute w-28 h-28 bg-blue-400 rounded-full opacity-10 bottom-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2"></div>

      <Container className="bg-white rounded-xl shadow-lg px-4 py-5 w-full max-w-[500px] mx-auto relative z-10">
        <h2 className="text-base font-semibold text-center text-gray-800 mb-4">Tạo thông tin cá nhân</h2>

        <Form onSubmit={handleRegister} className="space-y-3 text-[12px]">

          <Form.Group controlId="lastName">
            <Form.Label>Họ</Form.Label>
            <Form.Control type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required size="sm" />
          </Form.Group>

          <Form.Group controlId="firstName">
            <Form.Label>Tên</Form.Label>
            <Form.Control type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required size="sm" />
          </Form.Group>

          <Form.Group controlId="mobile">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} required size="sm" />
          </Form.Group>

          <Form.Group controlId="dob" className='mt-2'>
            <Form.Label>Ngày sinh</Form.Label>
            <DatePicker
              selected={dob}
              onChange={(date: Date | null) => setDob(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Chọn ngày sinh"
              className="form-control form-control-sm"
              maxDate={new Date()}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              required
            />
          </Form.Group>

          <Form.Group controlId="gender">
            <Form.Label>Giới tính</Form.Label>
            <Form.Select value={gender} onChange={(e) => setGender(Number(e.target.value))} size="sm">
              <option value={1}>Nam</option>
              <option value={2}>Nữ</option>
              <option value={3}>Khác</option>
            </Form.Select>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-full mt-3 py-1.5 text-sm rounded">
            Tạo tài khoản
          </Button>

        </Form>
      </Container>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Register;
