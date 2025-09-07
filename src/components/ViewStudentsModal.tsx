import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  Stack,
  Snackbar,
  Alert,
  LinearProgress,
  Typography,
  Box,
  Avatar,
  Tooltip,
} from '@mui/material';
import { getClassStudents } from '../services/classService';

interface ViewStudentsModalProps {
  show: boolean;
  onHide: () => void;
  classId: number;
  className: string;
}

interface Student {
  id: number;
  username: string;
  email: string;
  dob?: string;
  grade?: number;   // 0: 10, 1: 11, 2: 12 (tuỳ backend)
  gender?: number;  // 1: Nam, 0: Nữ (tuỳ backend)
  full_name?: string;
  created_at?: string;
}

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');

const genderText = (g?: number) => {
  if (g === 1) return 'Nam';
  if (g === 0) return 'Nữ';
  return 'Khác';
};

const genderColor = (g?: number): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
  if (g === 1) return 'info';
  if (g === 0) return 'secondary';
  return 'default';
};

const gradeText = (g?: number) => {
  if (g === 0) return 'Lớp 10';
  if (g === 1) return 'Lớp 11';
  if (g === 2) return 'Lớp 12';
  return '—';
};

const gradeColor = (g?: number): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
  if (g === 0) return 'primary';
  if (g === 1) return 'success';
  if (g === 2) return 'warning';
  return 'default';
};

const initials = (name?: string) => {
  const n = (name || '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
};

const ViewStudentsModal: React.FC<ViewStudentsModalProps> = ({ show, onHide, classId, className }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    if (show && classId) fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, classId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Tuỳ service: nhận { list, total } hoặc { data: { list, total } }
      const result = await getClassStudents({ classId, page: 0, size: 100 });
      const list: Student[] =
        (result?.list as Student[]) ??
        (result?.data?.list as Student[]) ??
        ([] as Student[]);

      setStudents(list || []);
      setSnack({
        open: true,
        message: `Đã tải ${list?.length ?? 0} học sinh`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Error loading students:', err);
      setSnack({
        open: true,
        message: 'Không thể tải danh sách học sinh',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={show} onClose={onHide} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Danh sách học sinh
            </Typography>
            <Chip label={className} size="small" color="primary" variant="outlined" />
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Làm mới">
              <Button onClick={fetchStudents} size="small" variant="outlined">
                Tải lại
              </Button>
            </Tooltip>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          {loading && <LinearProgress sx={{ mb: 1 }} />}

          <Paper
            variant="outlined"
            sx={{
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 'none',
            }}
          >
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small" aria-label="students table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tên đăng nhập</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ngày sinh</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Khối</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Giới tính</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ngày tham gia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Không có học sinh nào trong lớp này
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s, idx) => (
                      <TableRow
                        key={s.id}
                        hover
                        sx={{
                          '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28 }}>
                              {initials(s.full_name || s.username)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {s.full_name || s.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {s.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{s.username}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{s.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(s.dob)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={gradeText(s.grade)}
                            color={gradeColor(s.grade)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={genderText(s.gender)}
                            color={genderColor(s.gender)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(s.created_at)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Footer info */}
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Tổng số: {students.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cập nhật: {formatDate(new Date().toISOString())}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onHide} variant="outlined">Đóng</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ViewStudentsModal;
