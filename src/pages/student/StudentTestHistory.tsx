import React, { useEffect, useMemo, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination,
  Typography, TextField, MenuItem, Box, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, Divider, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import type { BaseListMenu } from '../../types';
import testService from '../../services/testService';
import studentTestService from '../../services/studentTestService';
import { formatDate } from '../../utils';

const PAGE_SIZE = 5;

type TestHistoryItem = {
  test_id: number;
  student_test_id: number;
  attempt: number;
  title: string;
  subject: number;      // 0: Toán, 1: Vật lý (tuỳ backend)
  grade: number;        // 0: 10, 1: 11, 2: 12
  submitted_at: string; // ISO
  score: number;        // Điểm đạt
  test_type: number;    // 0: Luyện tập (ví dụ)
  test_duration: number;// phút
};

type QuestionDetail = {
  id: number;
  question_content: string;
  question_type: number;
  difficulty: number;
  cognitive_level: number;
  point: number;
  max_point: number;
  correct_answer: string;
  student_answer: string;
  is_correct: boolean;
  simulation_data: string | null;
  choices: {
    id: number;
    content: string;
    is_correct: boolean;
    question_id: number;
  }[];
  selected_choice_ids: number[];
};

type TestResultDetail = {
  test_id: number;
  test_title: string;
  test_subject: number;
  test_grade: number;
  test_created_by: number;
  test_created_by_name: string;
  score: number;
  max_score: number;
  attempt: number;
  duration: number;
  questions: QuestionDetail[];
};

interface StudentTestHistoryProps {
  listMenuUser: BaseListMenu[];
}

const gradeLabel = (g: number) => (g === 0 ? 'Lớp 10' : g === 1 ? 'Lớp 11' : 'Lớp 12');
const subjectLabel = (s: number) => (s === 0 ? 'Toán học' : 'Vật lý');
const typeLabel = (t: number) => (t === 0 ? 'Luyện tập' : `Loại ${t}`);

const StudentTestHistory: React.FC<StudentTestHistoryProps> = ({ listMenuUser }) => {
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [filtered, setFiltered] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [subject, setSubject] = useState<number | ''>('');

  // paging
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(PAGE_SIZE);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const { list } = await testService.getTestHistory({ page: 0, size: 1000 });
      const items = Array.isArray(list) ? list : [];
      setHistory(items);
      setFiltered(items);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error?.message || 'Không thể tải lịch sử làm bài');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleFilter = () => {
    // Nếu không filter gì thì trả về toàn bộ danh sách
    if (search.trim() === '' && grade === '' && subject === '') {
      setFiltered(history);
      setPage(0);
      return;
    }

    const kw = search.trim().toLowerCase();
    const next = history.filter((t) => {
      const matchSearch = !kw || t.title.toLowerCase().includes(kw);
      const matchGrade = grade === '' || t.grade === grade;
      const matchSubject = subject === '' || t.subject === subject;
      return matchSearch && matchGrade && matchSubject;
    });

    setFiltered(next);
    setPage(0);
  };

  // Tính điểm trung bình / meta
  const stats = useMemo(() => {
    if (!filtered.length) return { avg: 0, count: 0 };
    const total = filtered.reduce((acc, it) => acc + (Number(it.score) || 0), 0);
    return { avg: +(total / filtered.length).toFixed(2), count: filtered.length };
  }, [filtered]);

  // Detail modal handlers
  const handleOpenDetailModal = async (studentTestId: number) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const response = await studentTestService.getResultDetail(studentTestId);
      setSelectedTest(response.data);
    } catch (err) {
      console.error('Error loading test details:', err);
      setError('Không thể tải chi tiết bài kiểm tra');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedTest(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar listMenuUser={listMenuUser} />

      <Container className=" py-8 flex-grow">
        <div className="flex items-center justify-between mb-4 mt-4">
          <div>
            <Typography variant="caption" color="textSecondary" className="block">
              Trang chủ / Lịch sử làm bài
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
              Lịch sử làm bài
            </Typography>
          </div>

          {/* quick stats */}
          <div className="flex gap-2">
            <Chip label={`Bài đã làm: ${stats.count}`} color="primary" variant="outlined" />
            <Chip label={`Điểm TB: ${stats.avg}`} color="success" variant="outlined" />
          </div>
        </div>

        {/* Filters */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={12}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          </Box>



          <Box className="flex gap-2">
            <TextField
              size="small"
              label="Tìm theo tiêu đề"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 260 }}
              placeholder="Nhập từ khoá..."
            />

            <TextField
              select
              size="small"
              label="Lớp"
              value={grade}
              onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ width: 150 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value={0}>Lớp 10</MenuItem>
              <MenuItem value={1}>Lớp 11</MenuItem>
              <MenuItem value={2}>Lớp 12</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Môn học"
              value={subject}
              onChange={(e) => setSubject(e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ width: 150 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value={0}>Toán học</MenuItem>
              <MenuItem value={1}>Vật lý</MenuItem>
            </TextField>
            <Button
              variant="contained"
              className="btn btn-primary"
              startIcon={<SearchIcon />}
              onClick={handleFilter}
              sx={{ height: 40 }}
            >
              Lọc
            </Button>
            <Button variant="outlined" onClick={() => {
              setSearch('');
              setGrade('');
              setSubject('');
              setFiltered(history);
              setPage(0);
            }}>
              Đặt lại
            </Button>
          </Box>
        </Box>

        {/* Content */}
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
                    <TableCell>Lớp</TableCell>
                    <TableCell>Môn học</TableCell>
                    <TableCell>Lần làm</TableCell>
                    <TableCell>Nộp lúc</TableCell>
                    <TableCell>Điểm</TableCell>
                    <TableCell>Thời lượng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="py-8 text-center">
                        <Typography variant="body2" className="text-gray-500">
                          Chưa có lịch sử làm bài
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, idx) => (
                        <TableRow key={`${row.student_test_id}-${row.test_id}`} className="hover:bg-gray-50 transition-colors">
                          <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" className="font-medium text-gray-800">
                              {row.title}
                            </Typography>
                          </TableCell>
                          <TableCell>{gradeLabel(row.grade)}</TableCell>
                          <TableCell>{subjectLabel(row.subject)}</TableCell>
                          <TableCell>{row.attempt}</TableCell>
                          <TableCell>{row.submitted_at ? formatDate(row.submitted_at) : '-'}</TableCell>
                          <TableCell>
                            <Chip label={Number(row.score.toFixed(1))} color="success" variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>{Math.floor(row.test_duration / 60) ? `${Math.floor(row.test_duration / 60)} phút` : '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenDetailModal(row.student_test_id)}
                            >
                              Chi tiết
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
              count={filtered.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              className="border-t border-gray-200"
            />
          </div>
        )}
      </Container>

      <Footer listMenuUser={listMenuUser} />

      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Chi tiết kết quả bài kiểm tra
            </Typography>
            <IconButton onClick={handleCloseDetailModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Spinner animation="border" variant="primary" />
            </Box>
          ) : selectedTest ? (
            <Box>
              {/* Test Info */}
              <Box mb={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                <Typography variant="h6" gutterBottom>
                  {selectedTest.test_title}
                </Typography>
                <Box display="flex" gap={4} flexWrap="wrap">
                  <Typography variant="body2">
                    <strong>Môn học:</strong> {subjectLabel(selectedTest.test_subject)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Lớp:</strong> {gradeLabel(selectedTest.test_grade)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Điểm:</strong> {Number(selectedTest.score.toFixed(1))} / {Number(selectedTest.max_score.toFixed(1))}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Lần làm:</strong> {selectedTest.attempt}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Thời gian:</strong> {Math.floor(selectedTest.duration /60)} phút
                  </Typography>
                </Box>
              </Box>

              {/* Questions */}
              <Typography variant="h6" gutterBottom>
                Chi tiết câu hỏi ({selectedTest.questions.length} câu)
              </Typography>

              {selectedTest.questions.map((question, index) => (
                <Accordion key={question.id} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      {question.is_correct ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                      <Typography>
                        Câu {index + 1} - {question.is_correct ? 'Đúng' : 'Sai'}
                        ({question.point}/{question.max_point} điểm)
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Box>
                      <Typography variant="body1" paragraph>
                        <strong>Câu hỏi:</strong> {question.question_content}
                      </Typography>

                      <Typography variant="body2" color="textSecondary" paragraph>
                        <strong>Đáp án đúng:</strong> {
                          question.choices.find(c => c.id.toString() === question.correct_answer)?.content ||
                          question.correct_answer
                        }
                      </Typography>

                      <Typography variant="body2" color="textSecondary" paragraph>
                        <strong>Đáp án của bạn:</strong> {
                          question.choices.find(c => c.id.toString() === question.student_answer)?.content ||
                          question.student_answer
                        }
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="body2" gutterBottom>
                        <strong>Các lựa chọn:</strong>
                      </Typography>

                      <List dense>
                        {question.choices.map((choice) => (
                          <ListItem key={choice.id}>
                            <ListItemText
                              primary={choice.content}
                              secondary={
                                <Box display="flex" gap={1} alignItems="center">
                                  {choice.is_correct && (
                                    <Chip label="Đáp án đúng" size="small" color="success" />
                                  )}
                                  {question.selected_choice_ids.includes(choice.id) && (
                                    <Chip label="Lựa chọn của bạn" size="small" color={choice.is_correct ? "success" : "error"} />
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetailModal} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentTestHistory;
