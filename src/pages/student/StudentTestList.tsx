import React, { useEffect, useState, useCallback } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination,
  Typography, TextField, MenuItem, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert,
  FormGroup, FormControlLabel, Checkbox,
  FormControl, InputLabel, Select} from '@mui/material';
  import type { SelectChangeEvent } from '@mui/material/Select';
import SearchIcon from '@mui/icons-material/Search';

import testService from '../../services/testService';
import chapterService from '../../services/chapterService';

import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import type { BaseListMenu, Chapter } from '../../types';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils';

const PAGE_SIZE = 5;

interface Test {
  id: number;
  title: string;
  description: string;
  subject: number;
  grade: number;
  total_score: number;
  max_attempt: number;
  deadline: string;
  duration: number;
  created_at: string;
  status: number;
}
const getGradeText = (grade: number) => {
  switch (grade) {
    case 0: return 'Lớp 10';
    case 1: return 'Lớp 11';
    case 2: return 'Lớp 12';
    default: return 'Không xác định';
  }
};
interface StudentTestListProps {
  listMenuUser: BaseListMenu[];
}

const StudentTestList: React.FC<StudentTestListProps> = ({ listMenuUser }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // grade từ localStorage (number | '')
  const [grade, setGrade] = useState<number | ''>(() => {
    const g = localStorage.getItem('grade');
    return g && g !== '' ? Number(g) : '';
  });

  // BỘ LỌC danh sách test (không liên quan đến modal cá nhân hoá)
  const [subject, setSubject] = useState<number | ''>('');
  const [search, setSearch] = useState('');

  // Modal tạo Personalized Test (độc lập filter)
  const [personalizeModalOpen, setPersonalizeModalOpen] = useState(false);
  const [personalizeLoading, setPersonalizeLoading] = useState(false);
  const [pSubject, setPSubject] = useState<number | ''>(''); // subject trong modal

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Chapters cho modal
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>([]);

  const userId = localStorage.getItem('userId') || '';
  const navigate = useNavigate();

  // (tuỳ chọn) sync grade về localStorage khi đổi ở filter ngoài
  useEffect(() => {
    if (grade === '') {
      localStorage.removeItem('grade');
    } else {
      localStorage.setItem('grade', String(grade));
    }
  }, [grade]);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { list } = await testService.getTests({
        page: 0,
        size: 1000,
        student_id: userId,
      });

      const fetchedTests = Array.isArray(list) ? list : [];
      setTests(fetchedTests);
      setFilteredTests(fetchedTests);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTests();
    } else {
      setError('User not authenticated');
    }
  }, [userId, fetchTests]);

  // 🔴 Load chapters CHỈ theo grade (localStorage) + pSubject (chọn trong modal)
  useEffect(() => {
    if (!personalizeModalOpen) return;

    if (pSubject === '') {
      setChapters([]);
      return;
    }

    (async () => {
      try {
        setChaptersLoading(true);
        const { list } = await chapterService.getChapters({
          page: 0,
          size: 5000,
          grade: grade === '' ? undefined : Number(grade), // grade lấy từ localStorage
          subject: Number(pSubject),                       // subject chọn trong modal
        });
        setChapters(list);
      } catch (e) {
        console.error(e);
      } finally {
        setChaptersLoading(false);
      }
    })();
  }, [personalizeModalOpen, grade, pSubject]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Filter list tests (không liên quan modal)
  const handleFilterChange = () => {
    if (search.trim() === '' && grade === '' && subject === '') {
      fetchTests();
      return;
    }

    const filtered = tests.filter(test => {
      const matchSearch =
        search === '' ||
        test.title.toLowerCase().includes(search.toLowerCase()) ||
        (test.description || '').toLowerCase().includes(search.toLowerCase());

      const matchGrade = grade === '' ? true : test.grade === Number(grade);
      const matchSubject = subject === '' ? true : test.subject === Number(subject);

      return matchSearch && matchGrade && matchSubject;
    });

    setFilteredTests(filtered);
    setPage(0);
  };

  const handlePractice = (testId: number, status: number) => {
    navigate(`/student-test-detail/${testId}`, { state: { status } });
  };

  const handleOpenPersonalizeModal = () => {
    setPersonalizeModalOpen(true);
    setPSubject('');
    setSelectedChapterIds([]);
  };

  const handleClosePersonalizeModal = () => {
    setPersonalizeModalOpen(false);
    setPSubject('');
    setSelectedChapterIds([]);
  };

  const handleSnackbarClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar listMenuUser={listMenuUser} />
      <Container className="py-8 flex-grow">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
            Danh sách bài luyện tập
          </Typography>

          <Box display="flex" gap={2} alignItems="center" mt={2}>
            <Button
              variant="contained"
              onClick={() => navigate('/student-test-history')}
              sx={{
                height: 40,
                bgcolor: 'var(--bs-primary)',
                color: '#fff',
                '&:hover': { bgcolor: '#d65f1d' },
              }}
            >
              Lịch sử làm bài
            </Button>

            <Button
              variant="contained"
              onClick={handleOpenPersonalizeModal}
              sx={{
                height: 40,
                bgcolor: '#16a34a',
                '&:hover': { bgcolor: '#15803d' },
                color: '#fff',
              }}
            >
              Tạo bài kiểm tra cá nhân hoá
            </Button>
          </Box>
        </Box>

        {/* Filters (không liên quan modal) */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box display="flex" gap={2}></Box>
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              label="Tìm kiếm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ width: 250 }}
              placeholder="Nhập từ khóa..."
            />
            <TextField
              select
              label="Lớp"
              value={grade}
              onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              sx={{ width: 150 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value={0}>Lớp 10</MenuItem>
              <MenuItem value={1}>Lớp 11</MenuItem>
              <MenuItem value={2}>Lớp 12</MenuItem>
            </TextField>

            <TextField
              select
              label="Môn học"
              value={subject}
              onChange={(e) => setSubject(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              sx={{ width: 150 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value={0}>Toán học</MenuItem>
              <MenuItem value={1}>Vật lý</MenuItem>
            </TextField>
            <Button
              variant="contained"
              className='btn btn-primary'
              startIcon={<SearchIcon />}
              onClick={handleFilterChange}
              sx={{ height: 40 }}
            >
              Lọc
            </Button>
          </Box>
        </Box>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner animation="border" variant="primary" className="h-12 w-12" />
            <Typography variant="body1" className="mt-4 text-gray-600">
              Đang tải dữ liệu...
            </Typography>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <Typography color="error" variant="body1">{error}</Typography>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <TableContainer component={Paper} elevation={0}>
              <Table className="min-w-full">
                <TableHead className="bg-gray-50">
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Tiêu đề</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell>Môn học</TableCell>
                    <TableCell>Điểm tối đa</TableCell>
                    <TableCell>Hạn nộp</TableCell>
                    <TableCell>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center">
                        <Typography variant="body2" className="text-gray-500">Không có bài luyện tập nào</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((test, idx) => (
                      <TableRow key={test.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>{test.title}</TableCell>
                        <TableCell>{test.description ? test.description : '-'}</TableCell>
                        <TableCell>{test.grade === 0 ? 'Lớp 10' : test.grade === 1 ? 'Lớp 11' : 'Lớp 12'}</TableCell>
                        <TableCell>{test.subject === 0 ? 'Toán học' : 'Vật lý'}</TableCell>
                        <TableCell>{test.total_score}</TableCell>
                        <TableCell>
                          {test.deadline ? formatDate(test.deadline) : 'Không thời hạn'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            className={`btn ${test.status === 1 ? 'btn-success' : 'btn-primary'}`}
                            size="small"
                            onClick={() => handlePractice(test.id, test.status)}
                          >
                            {test.status === 1 ? 'Tiếp tục làm' : 'Bắt đầu làm'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[PAGE_SIZE]}
              component="div"
              count={filteredTests.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              className="border-t border-gray-200"
            />
          </div>
        )}
      </Container>
      <Footer listMenuUser={listMenuUser} />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: { xs: 70, sm: 70 } }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Personalize Test Modal */}
      <Dialog open={personalizeModalOpen} onClose={handleClosePersonalizeModal} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo bài kiểm tra cá nhân hoá</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 1) Chọn môn trong modal */}
            <FormControl fullWidth>
              <InputLabel id="psubject-label">Môn học</InputLabel>
              <Select
                labelId="psubject-label"
                label="Môn học"
                value={pSubject === '' ? '' : String(pSubject)}
                onChange={(e: SelectChangeEvent<string>) => {
                  const val = e.target.value;
                  setPSubject(val === '' ? '' : Number(val));
                  setSelectedChapterIds([]); // reset khi đổi môn
                }}
              >
                <MenuItem value=""><em>-- Chọn môn --</em></MenuItem>
                <MenuItem value="0">Toán học</MenuItem>
                <MenuItem value="1">Vật lý</MenuItem>
              </Select>
            </FormControl>

            {/* 2) Danh sách chương theo grade(localStorage) & pSubject */}
            {pSubject === '' ? (
              <Typography variant="body2" color="text.secondary">
                Hãy chọn môn để hiển thị danh sách chương (khối: {grade === '' ? 'theo cấu hình của bạn' : grade}).
              </Typography>
            ) : (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Chọn Chương
                </Typography>

                {chaptersLoading ? (
                  <Typography variant="body2">Đang tải danh sách chương…</Typography>
                ) : chapters.length === 0 ? (
                  <Typography variant="body2">Không có chương nào.</Typography>
                ) : (
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedChapterIds.length > 0 && selectedChapterIds.length === chapters.length}
                            indeterminate={selectedChapterIds.length > 0 && selectedChapterIds.length < chapters.length}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              if (e.target.checked) setSelectedChapterIds(chapters.map(c => c.id));
                              else setSelectedChapterIds([]);
                            }}
                          />
                        }
                        label="Chọn tất cả"
                      />

                      {chapters.map((c) => (
                        <FormControlLabel
                          key={c.id}
                          control={
                            <Checkbox
                              checked={selectedChapterIds.includes(c.id)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setSelectedChapterIds(prev =>
                                  e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                                );
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.chapter_name}</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {`Môn #${c.subject == 0 ?'Toán hình' : 'Vật lý'}`} {typeof c.grade === 'number' ? `• Khối ${getGradeText(c.grade)}` : ''}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePersonalizeModal} disabled={personalizeLoading}>
            Hủy
          </Button>
          <Button
            onClick={async () => {
              try {
                if (pSubject === '') {
                  setSnackbarMessage('Vui lòng chọn môn học.');
                  setSnackbarSeverity('warning');
                  setSnackbarOpen(true);
                  return;
                }
                if (selectedChapterIds.length === 0) {
                  setSnackbarMessage('Vui lòng chọn ít nhất một chương.');
                  setSnackbarSeverity('warning');
                  setSnackbarOpen(true);
                  return;
                }

                setPersonalizeLoading(true);

                await testService.personalizeTest(
                  Number(pSubject),      // subjectId từ modal
                  selectedChapterIds     // chapterIds đã chọn
                );

                setSnackbarMessage('Đã tạo bài kiểm tra cá nhân hoá');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                fetchTests();
                handleClosePersonalizeModal();
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Tạo bài kiểm tra thất bại';
                setSnackbarMessage(message);
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
              } finally {
                setPersonalizeLoading(false);
              }
            }}
            disabled={pSubject === '' || selectedChapterIds.length === 0 || personalizeLoading}
            variant="contained"
            color="success"
          >
            {personalizeLoading ? 'Đang tạo...' : 'Tạo bài kiểm tra'}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default StudentTestList;
