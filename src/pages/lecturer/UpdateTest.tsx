import React, { useEffect, useState } from 'react';
import { Container, Button, Form, Spinner, Card, Row, Col, Badge, Modal } from 'react-bootstrap';
import {
  Typography,
  Snackbar,
  Alert as MuiAlert,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  FilterList as FilterIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import LecturerSidebar from '../../components/layout/LecturerSidebar';
import LecturerNavbar from '../../components/layout/LecturerNavbar';
import LecturerFooter from '../../components/layout/LecturerFooter';
import questionService from '../../services/questionService';
import chapterService from '../../services/chapterService';
import lessonService from '../../services/lessonService';
import testService from '../../services/testService';
import { useNavigate, useParams } from 'react-router-dom';
import MathJaxHtml from '../../components/common/MathJaxHtml';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import DeleteIcon from '@mui/icons-material/Delete';

const UpdateTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  console.log('Received testId:', testId); // Debugging line
  const [form, setForm] = useState({
    title: '',
    description: '',
    total_score: '10',
    subject: '',
    grade: '',
    questions: [] as { question_id: number; point: number; allow_partial_score: boolean }[],
    duration: 60,
    deadline: '',
    max_attempt: 1,
  });
  const [questionBank, setQuestionBank] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [questionBankLoading, setQuestionBankLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' });
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chapterOptions, setChapterOptions] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [lessonOptions, setLessonOptions] = useState<any[][]>([]);
  const [filterLessonOptions, setFilterLessonOptions] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [, setSelectedType] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [, setSelectedQuestionForDetail] = useState<any>(null);
  const [showQuestionDetailModal, setShowQuestionDetailModal] = useState(false);
  const [detailedQuestionData, setDetailedQuestionData] = useState<any>(null);
  const [loadingQuestionDetail, setLoadingQuestionDetail] = useState(false);
  // const [showQuestionList, setShowQuestionList] = useState(true);

  interface QuestionConfig {
    chapter_id: string | null;
    lesson_id: string | null;
    number_of_questions: number;
    type: number;
    difficulty: number;
    subject: string;
    grade: string;
  }
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfig[]>([
    {
      chapter_id: null,
      lesson_id: null,
      number_of_questions: 5,
      type: 0,
      difficulty: 0,
      subject: '',
      grade: ''
    }
  ]);

  // Fetch test details on mount
  useEffect(() => {
    // Add a small delay to allow useParams to properly extract the testId
    const timer = setTimeout(() => {
      if (!testId) {
        console.log('No testId found in URL parameters, redirecting to test list');
        navigate('/lecturer/test');
        return;
      }
      fetchTestDetails();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [testId]);

  const fetchTestDetails = async () => {
    setFetchLoading(true);
    try {
      const response = await testService.getTestDetail(Number(testId));
      const testData = response.data.data;

      setForm({
        title: testData.title || '',
        description: testData.description || '',
        total_score: String(testData.total_score || '10'),
        subject: String(testData.subject || ''),
        grade: String(testData.grade || ''),
        questions: testData.questions?.map((q: any) => ({
          question_id: q.question_id || q.id,
          point: q.point || 1,
          allow_partial_score: q.allow_partial_score || false
        })) || [],
        duration: testData.duration || 60,
        deadline: testData.deadline ? new Date(testData.deadline).toISOString().slice(0, 16) : '',
        max_attempt: testData.max_attempt || 1,
      });
      setQuestionBank(testData.questions || []);
      // Set grade and subject from test data
      const grade = String(testData.grade || '');
      const subject = String(testData.subject || '0');
      console.log('garede: ', grade,'sub:', subject);
      if (!grade || !subject) {
        navigate('/lecturer/test');
        return;
      }

      // Update question configurations
      setQuestionConfigs(prevConfigs => {
        const newConfigs = [...prevConfigs];
        newConfigs[0] = {
          ...newConfigs[0],
          subject: subject,
          grade: grade
        };
        return newConfigs;
      });

      // Fetch chapters for the selected grade/subject
      chapterService.getChapters({
        page: 1,
        size: 100,
        grade: Number(grade),
        subject: Number(subject)
      })
        .then(({ list }) => setChapterOptions(Array.isArray(list) ? list : []))
        .catch(() => setChapterOptions([]));

    } catch (error) {
      console.error('Error fetching test details:', error);
      setSnackbar({ open: true, message: 'Không thể tải thông tin bài luyện tập', severity: 'error' });
      navigate('/lecturer/test');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedChapter || !form.grade || !form.subject) {
      setFilterLessonOptions([]);
      setSelectedLesson('');
      return;
    }

    lessonService.getLessons({
      subject: Number(form.subject),
      grade: Number(form.grade),
      chapter_id: Number(selectedChapter),
      page: 0,
      size: 1000
    })
      .then((data) => {
        setFilterLessonOptions(data.list || []);
      })
      .catch(() => {
        setFilterLessonOptions([]);
      });
  }, [selectedChapter, form.grade, form.subject]);

  const handleFormChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectQuestion = (questionId: number, checked: boolean) => {
    setForm(prev => {
      let questions = prev.questions.slice();
      if (checked) {
        questions.push({ question_id: questionId, point: 1.0, allow_partial_score: true });
      } else {
        questions = questions.filter(q => q.question_id !== questionId);
      }
      return { ...prev, questions };
    });
  };

  const handleQuestionPointChange = (questionId: number, point: number) => {
    const rounded = Math.round(point * 10) / 10;
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.question_id === questionId ? { ...q, point: rounded } : q),
    }));
  };

  const handleQuestionPartialChange = (questionId: number, allow: boolean) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.question_id === questionId ? { ...q, allow_partial_score: allow } : q),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!form.title?.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập tiêu đề bài luyện tập', severity: 'error' });
      return;
    }

    if (!form.total_score || Number(form.total_score) <= 0) {
      setSnackbar({ open: true, message: 'Vui lòng nhập điểm tối đa hợp lệ', severity: 'error' });
      return;
    }

    if (!form.questions || form.questions.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng chọn ít nhất 1 câu hỏi', severity: 'error' });
      return;
    }

    // Validate total score matches sum of question points
    const totalPoints = form.questions.reduce((sum, q) => sum + (q.point || 0), 0);
    if (Math.abs(totalPoints - Number(form.total_score)) > 0.1) {
      setSnackbar({
        open: true,
        message: `Tổng điểm các câu hỏi (${totalPoints}) không khớp với điểm tối đa (${form.total_score})`,
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        id: Number(testId),
        title: form.title.trim(),
        description: form.description?.trim() || '',
        total_score: Number(form.total_score),
        subject: Number(form.subject),
        grade: Number(form.grade),
        questions: form.questions.map(q => ({
          id: 0,
          question_id: q.question_id,
          coefficient: Number(q.point) || 1,
          allow_partial_score: Boolean(q.allow_partial_score)
        })),
        duration: form.duration,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        max_attempt: form.max_attempt,
        test_assignments: []
      };

      console.log('Sending update data:', updateData);
      await testService.updateTest(Number(testId), updateData);
      setSnackbar({ open: true, message: 'Cập nhật bài luyện tập thành công', severity: 'success' });
      setTimeout(() => navigate('/lecturer/test'), 1500);
    } catch (error: any) {
      console.error('Error updating test:', error);

      // Enhanced error handling with specific messages
      let errorMessage = 'Cập nhật bài luyện tập thất bại';

      if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message[0]
          : error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng luyện tập lại thông tin';
      } else if (error.response?.status === 404) {
        errorMessage = 'Bài luyện tập không tồn tại';
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng thử lại';
      }

      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '0': return 'success';
      case '1': return 'warning';
      case '2': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case '0': return 'Dễ';
      case '1': return 'Trung bình';
      case '2': return 'Khó';
      default: return 'Không xác định';
    }
  };

  const clearAllFilters = () => {
    setSelectedChapter('');
    setSelectedLesson('');
    setSelectedDifficulty('');
    setSelectedType('');
  };

  const filteredQuestionBank = questionBank.filter(q => {
    let match = true;
    if (selectedChapter && q.chapter_id !== undefined) match = match && String(q.chapter_id) === selectedChapter;
    if (selectedLesson && q.lesson_id !== undefined) match = match && String(q.lesson_id) === selectedLesson;
    if (selectedDifficulty !== '') match = match && String(q.difficulty) === selectedDifficulty;
    return match;
  });

  const getGradeText = (grade: string) => {
    switch (grade) {
      case '0': return 'Lớp 10';
      case '1': return 'Lớp 11';
      case '2': return 'Lớp 12';
      default: return 'Không xác định';
    }
  };

  const getSubjectText = (subject: string) => {
    switch (subject) {
      case '0': return 'Toán học';
      case '1': return 'Vật lý';
      default: return 'Không xác định';
    }
  };

  const currentPageQuestions = filteredQuestionBank.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const allCurrentPageSelected = currentPageQuestions.length > 0 &&
    currentPageQuestions.every(q => form.questions.some(sel => sel.question_id === q.id));

  const handleViewQuestionDetail = async (question: any) => {
    setSelectedQuestionForDetail(question);
    setShowQuestionDetailModal(true);
    setLoadingQuestionDetail(true);

    try {
      const detailedData = await questionService.getQuestionById(question.id);
      setDetailedQuestionData(detailedData);
    } catch (error) {
      console.error('Error fetching question details:', error);
      setDetailedQuestionData(null);
    } finally {
      setLoadingQuestionDetail(false);
    }
  };

  const handleCloseQuestionDetailModal = () => {
    setShowQuestionDetailModal(false);
    setSelectedQuestionForDetail(null);
    setDetailedQuestionData(null);
  };

  interface Question {
    id?: number;
    question_id?: number;
    point?: number;
    allow_partial_score?: boolean;
    // Thêm các trường khác nếu API trả về
  }

  const handleFetchQuestions = async () => {
    setQuestionBankLoading(true);

    try {
      const requests = questionConfigs.map(config => ({
        number_of_questions: config.number_of_questions,
        subject: form.subject,
        grade: form.grade,
        difficulty: Number(config.difficulty),
        type: Number(config.type),
        chapter_id: config.chapter_id,
        lesson_id: config.lesson_id,
      }));

      const response = await questionService.getRandomQuestionsFromSource(requests);

      if (Array.isArray(response.data)) {
        setQuestionBank(prevQuestions => {
          const newQuestions = response.data.filter((newQ: Question) =>
            !prevQuestions.some(
              (q: Question) => (q.question_id || q.id) === (newQ.question_id || newQ.id)
            )
          );
          return [...prevQuestions, ...newQuestions];
        });
      }
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      const message =
        error?.response?.data?.message?.[0] ||
        error.message ||
        'Đã xảy ra lỗi khi lấy câu hỏi.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setQuestionBankLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <>
        <LecturerSidebar onCollapse={setSidebarCollapsed} />
        <LecturerNavbar collapsed={sidebarCollapsed} />
        <LecturerFooter collapsed={sidebarCollapsed} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} min-h-screen bg-gradient-to-br from-slate-50 to-blue-50`}>
          <Container fluid className="py-4">
            <div className="text-center py-8">
              <Spinner animation="border" variant="primary" />
              <Typography variant="body2" className="mt-2 text-gray-600">
                Đang tải thông tin bài luyện tập...
              </Typography>
            </div>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <LecturerSidebar onCollapse={setSidebarCollapsed} />
      <LecturerNavbar collapsed={sidebarCollapsed} />
      <LecturerFooter collapsed={sidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} min-h-screen bg-gradient-to-br from-slate-50 to-blue-50`}>
        <Container fluid className="py-4">
          <div className="max-w-7xl mx-auto">
            <nav className="mb-4">
              <Typography variant="body2" className="text-gray-600">
                <a href="/lecturer/home" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Trang chủ
                </a>
                <span className="mx-2">•</span>
                <a href="/lecturer/test" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Luyện tập
                </a>
                <span className="mx-2">•</span>
                <span className="text-gray-800 font-medium">Cập nhật bài luyện tập</span>
              </Typography>
            </nav>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Card className="shadow-xl border-0 rounded-xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-black p-2 border-b-2 border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-white bg-opacity-20 rounded-lg shadow-inner">
                      <AssignmentIcon className="text-black" fontSize="small" />
                    </div>
                    <div>
                      <Typography variant="h6" className="font-bold mb-1 text-black drop-shadow-sm">
                        Cập nhật bài luyện tập
                      </Typography>
                      <Typography variant="body2" className="text-black text-sm opacity-90">
                        Chỉnh sửa thông tin bài luyện tập cho {getGradeText(form.grade)} - {getSubjectText(form.subject)}
                      </Typography>
                    </div>
                  </div>
                </div>
                <Card.Body className="p-3 bg-gradient-to-br from-gray-50 to-white">
                  <Row className="g-2">
                    <Col lg={8}>
                      <Form.Group>
                        <Form.Label className="text-gray-700 font-semibold mb-1 text-xs flex items-center gap-1">
                          Tiêu đề bài luyện tập <span className="highlight">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={form.title}
                          onChange={e => handleFormChange('title', e.target.value)}
                          placeholder="Nhập tiêu đề bài luyện tập..."
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded py-1 text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                          size="sm"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col lg={4}>
                      <Form.Group>
                        <Form.Label className="text-gray-700 font-semibold mb-1 text-xs flex items-center gap-1">
                          Điểm tối đa <span className="highlight">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          value={form.total_score}
                          onChange={e => handleFormChange('total_score', e.target.value)}
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded py-1 text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                          size="sm"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="text-gray-700 font-semibold mb-1 text-xs">
                          Mô tả
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={form.description}
                          onChange={e => handleFormChange('description', e.target.value)}
                          placeholder="Nhập mô tả cho bài luyện tập..."
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded text-sm transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Divider className="my-3 border-gray-300" />

                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-gray-700 font-semibold mb-1 text-xs">
                          Khối lớp
                        </Form.Label>
                        <Form.Select
                          value={form.grade}
                          disabled
                          className="border-2 border-gray-200 rounded py-1 bg-gray-100 text-sm shadow-sm"
                          size="sm"
                        >
                          <option value="0">Lớp 10</option>
                          <option value="1">Lớp 11</option>
                          <option value="2">Lớp 12</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-gray-700 font-semibold mb-1 text-xs">
                          Môn học
                        </Form.Label>
                        <Form.Select
                          value={form.subject}
                          disabled
                          className="border-2 border-gray-200 rounded py-1 bg-gray-100 text-sm shadow-sm"
                          size="sm"
                        >
                          <option value="0">Toán học</option>
                          <option value="1">Vật lý</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Divider className="my-3 border-gray-300" />

                  <Row className="g-2">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-gray-700 font-semibold mb-1 text-xs flex items-center gap-1">
                          Thời gian làm bài (phút) <span className="highlight">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          max={300}
                          value={form.duration}
                          onChange={e => handleFormChange('duration', parseInt(e.target.value) || 60)}
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded py-1 text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                          size="sm"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="text-gray-700 font-semibold mb-1 text-xs flex items-center gap-1">
                            Hạn nộp bài
                          </Form.Label>
                          <DateTimePicker
                            label="Hạn nộp"
                            value={form.deadline ? new Date(form.deadline) : null}
                            onChange={(date: Date | null) => {
                              const iso = date ? date.toISOString() : '';
                              handleFormChange('deadline', iso);
                            }}
                            minDateTime={new Date()}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                              },
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </LocalizationProvider>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="text-gray-700 font-semibold mb-1 text-xs flex items-center gap-1">
                          Số lần làm tối đa <span className="highlight">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          // max={10}
                          value={form.max_attempt}
                          onChange={e => handleFormChange('max_attempt', parseInt(e.target.value) || 1)}
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded py-1 text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                          size="sm"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="shadow-xl border-0 rounded-xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
                <Card.Body>
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-black p-2 border-b-2 border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-white bg-opacity-20 rounded-lg shadow-inner">
                          <SchoolIcon fontSize="small" className="text-black" />
                        </div>
                        <div>
                          <Typography variant="subtitle1" className="font-bold text-black drop-shadow-sm">
                            Ngân hàng câu hỏi
                          </Typography>
                          <Typography variant="body2" className="text-black text-sm opacity-90">
                            {filteredQuestionBank.length} câu hỏi có sẵn
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip
                          label={`${form.questions.length} câu đã chọn`}
                          className="bg-white text-black font-bold text-xs shadow-md border-2 border-green-200"
                          icon={<CheckCircleIcon />}
                          size="small"
                        />
                        <Tooltip title="Bộ lọc câu hỏi">
                          <IconButton
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-black hover:bg-green-800 hover:shadow-lg transition-all duration-200"
                            size="small"
                          >
                            <FilterIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body className="p-3 bg-gradient-to-br from-gray-50 to-white">
                  {showFilters && (
                    <Accordion className="mb-3 bg-gray-50 rounded">
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <div className="flex items-center gap-1">
                          <SettingsIcon className="text-gray-600" fontSize="small" />
                          <Typography variant="body2" className="font-semibold text-gray-700">
                            Bộ lọc câu hỏi
                          </Typography>
                        </div>
                      </AccordionSummary>
                      <AccordionDetails>
                        <div className="flex items-center justify-between mb-2">
                          <Typography variant="body2" className="font-medium text-gray-700 text-xs">
                            Lọc theo tiêu chí
                          </Typography>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-xs py-0 px-2 rounded"
                          >
                            Xóa tất cả
                          </Button>
                        </div>
                        <Row className="g-1">
                          <Col md={4}>
                            <Form.Select
                              value={selectedChapter}
                              onChange={e => setSelectedChapter(e.target.value)}
                              className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded text-xs transition-all"
                              size="sm"
                            >
                              <option value="">Tất cả chương</option>
                              {chapterOptions.map((chap: any) => (
                                <option key={chap.id} value={chap.id}>
                                  {chap.chapter_name}
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={4}>
                            <Form.Select
                              value={selectedLesson}
                              onChange={e => setSelectedLesson(e.target.value)}
                              disabled={!selectedChapter || filterLessonOptions.length === 0}
                              className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded text-xs transition-all"
                              size="sm"
                            >
                              <option value="">Tất cả bài học</option>
                              {filterLessonOptions.map((les: any) => (
                                <option key={les.id} value={les.id}>
                                  {les.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={4}>
                            <Form.Select
                              value={selectedDifficulty}
                              onChange={e => setSelectedDifficulty(e.target.value)}
                              className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded text-xs transition-all"
                              size="sm"
                            >
                              <option value="">Tất cả độ khó</option>
                              <option value="0">Dễ</option>
                              <option value="1">Trung bình</option>
                              <option value="2">Khó</option>
                            </Form.Select>
                          </Col>
                        </Row>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  <div className="mb-6 bg-gradient-to-br from-slate-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-black p-2">
                      <div className="flex">
                        <div className="p-1 bg-white bg-opacity-20 rounded-lg shadow-inner">
                          <AssignmentIcon className="text-black" fontSize="small" />
                        </div>
                        <div>
                          <Typography variant="h6" className="font-bold mb-1 text-black drop-shadow-sm">
                          Tạo Câu Hỏi Ngẫu Nhiên Từ Ngân Hàng
                          </Typography>
                        </div>
                      </div>
                    </div>

                    <div className="row g-4">
                      {questionConfigs.map((config, index) => (
                        <div className="col-lg-4 col-md-6" key={index}>
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="badge bg-primary text-xs px-2 py-1">
                                Bộ câu hỏi #{index + 1}
                              </span>
                              <IconButton
                                type="button"
                                onClick={() => {
                                  const newConfigs = [...questionConfigs];
                                  newConfigs.splice(index, 1);
                                  setQuestionConfigs(newConfigs);
                                }}
                                title="Xóa cấu hình"
                                style={{ width: '28px', height: '28px' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </div>

                            <div className="space-y-3">
                              <div className="form-group">
                                <label className="form-label text-xs font-medium text-gray-600 mb-1">
                                  Chương
                                </label>
                                <select
                                  className="form-select form-select-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  value={config.chapter_id || ''}
                                  onChange={async e => {
                                    const newConfigs = [...questionConfigs];
                                    newConfigs[index].chapter_id = e.target.value || null;
                                    newConfigs[index].lesson_id = null;
                                    setQuestionConfigs(newConfigs);

                                    if (e.target.value) {
                                      try {
                                        const lessonsData = await lessonService.getLessons({
                                          subject: Number(form.subject),
                                          grade: Number(form.grade),
                                          chapter_id: Number(e.target.value),
                                          page: 0,
                                          size: 1000
                                        });
                                        const newLessonOptions = [...lessonOptions];
                                        newLessonOptions[index] = lessonsData.list || [];
                                        setLessonOptions(newLessonOptions);
                                      } catch (error) {
                                        const newLessonOptions = [...lessonOptions];
                                        newLessonOptions[index] = [];
                                        setLessonOptions(newLessonOptions);
                                      }
                                    } else {
                                      const newLessonOptions = [...lessonOptions];
                                      newLessonOptions[index] = [];
                                      setLessonOptions(newLessonOptions);
                                    }
                                  }}
                                >
                                  <option value="">Chọn chương</option>
                                  {chapterOptions.map(chap => (
                                    <option key={chap.id} value={chap.id}>{chap.chapter_name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="form-label text-xs font-medium text-gray-600 mb-1">
                                  Bài học
                                </label>
                                <select
                                  className="form-select form-select-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  value={config.lesson_id || ''}
                                  onChange={e => {
                                    const newConfigs = [...questionConfigs];
                                    newConfigs[index].lesson_id = e.target.value || null;
                                    setQuestionConfigs(newConfigs);
                                  }}
                                >
                                  <option value="">Chọn bài học</option>
                                  {lessonOptions[index] && lessonOptions[index].length > 0 ? (
                                    lessonOptions[index].map(les => (
                                      <option key={les.id} value={les.id}>
                                        {les.name}
                                      </option>
                                    ))
                                  ) : (
                                    <option disabled>No lessons available</option>
                                  )}
                                </select>
                              </div>

                              <div className="row g-3">
                                <div className="col-md-6">
                                  <label className="form-label text-xs font-medium text-gray-600 mb-1">
                                    Số lượng câu hỏi
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    min={1}
                                    max={50}
                                    value={config.number_of_questions}
                                    onChange={e => {
                                      const newConfigs = [...questionConfigs];
                                      newConfigs[index].number_of_questions = parseInt(e.target.value);
                                      setQuestionConfigs(newConfigs);
                                    }}
                                  />
                                </div>

                                <div className="col-md-6">
                                  <label className="form-label text-xs font-medium text-gray-600 mb-1">
                                    Độ khó
                                  </label>
                                  <select
                                    className="form-select form-select-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={config.difficulty}
                                    onChange={e => {
                                      const newConfigs = [...questionConfigs];
                                      newConfigs[index].difficulty = parseInt(e.target.value);
                                      setQuestionConfigs(newConfigs);
                                    }}
                                  >
                                    <option value="">Tất cả</option>
                                    <option value="0">🟢 Dễ</option>
                                    <option value="1">🟡 Trung bình</option>
                                    <option value="2">🔴 Khó</option>
                                  </select>
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="form-label text-xs font-medium text-gray-600 mb-1">
                                  Loại câu hỏi
                                </label>
                                <select
                                  className="form-select form-select-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  value={config.type}
                                  onChange={e => {
                                    const newConfigs = [...questionConfigs];
                                    newConfigs[index].type = parseInt(e.target.value);
                                    setQuestionConfigs(newConfigs);
                                  }}
                                >
                                  <option value="0">📝 Một lựa chọn</option>
                                  <option value="1">☑️ Nhiều lựa chọn</option>
                                  {/* <option value="2">✏️ Điền vào chỗ trống</option>
                                  <option value="3">✅ Đúng/Sai</option> */}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="col-lg-4 col-md-6">
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer h-100 d-flex align-items-center justify-content-center"
                          onClick={() => setQuestionConfigs([...questionConfigs, {
                            chapter_id: null,
                            lesson_id: null,
                            number_of_questions: 5,
                            type: 0,
                            difficulty: 2,
                            subject: '',
                            grade: ''
                          }])}>
                          <div>
                            <div className="text-4xl text-gray-400 mb-2">+</div>
                            <p className="text-sm font-medium text-gray-600 mb-0">
                              Thêm cấu hình mới
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-center mt-3 mb-3">
                      <button
                        type="button"
                        className="btn btn-primary btn-lg px-5 py-2 rounded-pill shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={handleFetchQuestions}
                        disabled={questionConfigs.length === 0}
                      >
                        <i className="fas fa-magic me-2"></i>
                        Tạo câu hỏi ngẫu nhiên
                      </button>
                    </div>
                  </div>

                  {questionBankLoading ? (
                    <div className="text-center py-6">
                      <Spinner animation="border" variant="primary" size="sm" />
                      <Typography variant="body2" className="mt-2 text-gray-600 text-sm">
                        Đang tải câu hỏi...
                      </Typography>
                    </div>
                  ) : filteredQuestionBank.length === 0 ? (
                    <div className="text-center py-8">
                      <Typography variant="h6" className="text-gray-500 mb-2">
                        Không có dữ liệu
                      </Typography>
                      <Typography variant="body2" className="text-gray-400 text-sm">
                        Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại
                      </Typography>
                    </div>
                  ) : (
                    <Paper className="border-0 rounded overflow-hidden shadow">
                      <TableContainer className="max-h-64">
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                              <TableCell className="font-bold text-gray-700 w-10 text-center" style={{ fontWeight: 'bold' }}>
                                <Form.Check
                                  type="checkbox"
                                  checked={allCurrentPageSelected}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      currentPageQuestions.forEach(q => {
                                        if (!form.questions.some(sel => sel.question_id === q.id)) {
                                          handleSelectQuestion(q.id, true);
                                        }
                                      });
                                    } else {
                                      currentPageQuestions.forEach(q => {
                                        handleSelectQuestion(q.id, false);
                                      });
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-bold text-gray-700 text-center text-xs" style={{ fontWeight: 'bold' }}>STT</TableCell>
                              <TableCell className="font-bold text-gray-700 text-xs" style={{ fontWeight: 'bold' }}>Nội dung câu hỏi</TableCell>
                              <TableCell className="font-bold text-gray-700 text-center text-xs" style={{ fontWeight: 'bold' }}>Độ khó</TableCell>
                              <TableCell className="font-bold text-gray-700 text-center text-xs" style={{ fontWeight: 'bold' }}>Hệ số điểm</TableCell>
                              <TableCell className="font-bold text-gray-700 text-center text-xs" style={{ fontWeight: 'bold' }}>Chấm từng phần</TableCell>
                              <TableCell className="font-bold text-gray-700 text-center text-xs" style={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentPageQuestions.map((q: any, idx: number) => {
                              const selected = form.questions.some(sel => sel.question_id === q.id);
                              const questionIdx = page * rowsPerPage + idx;
                              const selectedQuestion = form.questions.find(sel => sel.question_id === q.id);

                              return (
                                <TableRow
                                  key={q.id}
                                  className={`hover:bg-blue-50 transition-all duration-200 ${selected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                    }`}
                                  style={{ height: '50px' }}
                                >
                                  <TableCell className="text-center" style={{ height: '50px' }}>
                                    <Form.Check
                                      type="checkbox"
                                      checked={selected}
                                      onChange={e => handleSelectQuestion(q.id, e.target.checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center" style={{ height: '50px' }}>
                                    <Badge bg="primary" className="rounded-full px-1 py-0 text-xs">
                                      {questionIdx + 1}
                                    </Badge>
                                  </TableCell>
                                  <TableCell style={{ minWidth: 300, maxWidth: 400, height: '50px' }}>
                                    <div className="max-w-full text-xs leading-relaxed overflow-hidden">
                                      <div className="line-clamp-2">
                                        <MathJaxHtml html={q.question_content} />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center" style={{ height: '50px' }}>
                                    <Chip
                                      label={getDifficultyText(String(q.difficulty))}
                                      color={getDifficultyColor(String(q.difficulty))}
                                      size="small"
                                      className="font-bold text-xs"
                                    />
                                  </TableCell>
                                  <TableCell className="text-center" style={{ height: '50px' }}>
                                    {selected && (
                                      <div className="d-flex align-items-center justify-content-center gap-1">
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={() => {
                                            let val = (selectedQuestion?.point ?? 1.0) - 0.5;
                                            if (val < 0.1) val = 0.1;
                                            handleQuestionPointChange(q.id, Math.round(val * 10) / 10);
                                          }}
                                          disabled={(selectedQuestion?.point ?? 1.0) <= 0.1}
                                          style={{ minWidth: 28, minHeight: 28, padding: 0 }}
                                        >
                                          -
                                        </Button>
                                        <Form.Control
                                          type="text"
                                          value={selectedQuestion?.point ?? 1.0}
                                          readOnly
                                          className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded text-center text-xs font-bold"
                                          style={{ width: 60, height: 28 }}
                                          size="sm"
                                        />
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={() => {
                                            let val = (selectedQuestion?.point ?? 1.0) + 0.5;
                                            if (val > 10) val = 10;
                                            handleQuestionPointChange(q.id, Math.round(val * 10) / 10);
                                          }}
                                          disabled={(selectedQuestion?.point ?? 1.0) >= 10}
                                          style={{ minWidth: 28, minHeight: 28, padding: 0 }}
                                        >
                                          +
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center" style={{ height: '50px' }}>
                                    {selected && (
                                      <Form.Check
                                        type="checkbox"
                                        checked={selectedQuestion?.allow_partial_score || false}
                                        onChange={e => handleQuestionPartialChange(q.id, e.target.checked)}
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center" style={{ height: '50px' }}>
                                    <Tooltip title="Xem chi tiết câu hỏi">
                                      <IconButton
                                        onClick={() => handleViewQuestionDetail(q)}
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-all duration-200"
                                        size="small"
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 20]}
                        component="div"
                        count={filteredQuestionBank.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={e => {
                          setRowsPerPage(parseInt(e.target.value, 10));
                          setPage(0);
                        }}
                        labelRowsPerPage="Số hàng mỗi trang:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
                        className="border-t bg-gray-50 text-xs"
                      />
                    </Paper>
                  )}
                </Card.Body>
              </Card>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => navigate('/lecturer/test')}
                  className="font-semibold border-2 hover:bg-gray-50 transition-all rounded px-3 py-1"
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={loading || form.questions.length === 0}
                  className="font-semibold bg-gradient-to-r from-blue-600 to-blue-700 border-0 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg rounded px-4 py-1"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="me-1" fontSize="small" />
                      Cập nhật bài luyện tập
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar(s => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ top: { xs: 70, sm: 70 } }}
          >
            <MuiAlert
              onClose={() => setSnackbar(s => ({ ...s, open: false }))}
              severity={snackbar.severity}
              variant="standard"
              className="shadow-lg"
            >
              {snackbar.message}
            </MuiAlert>
          </Snackbar>
        </Container >
      </main >

      <Modal show={showQuestionDetailModal} onHide={handleCloseQuestionDetailModal} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-to-r from-blue-50 to-blue-100">
          <Modal.Title className="font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <QuizIcon className="text-blue-600" fontSize="small" />
              Chi tiết câu hỏi
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {loadingQuestionDetail ? (
            <div className="text-center py-8">
              <Spinner animation="border" variant="primary" size="sm" />
              <Typography variant="body2" className="mt-2 text-gray-600 text-sm">
                Đang tải chi tiết câu hỏi...
              </Typography>
            </div>
          ) : detailedQuestionData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge bg="info" className="rounded-full px-2 py-1 text-xs">
                    ID: {detailedQuestionData.id}
                  </Badge>
                  <Chip
                    label={getDifficultyText(String(detailedQuestionData.difficulty))}
                    color={getDifficultyColor(String(detailedQuestionData.difficulty))}
                    size="small"
                    className="font-bold"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {getGradeText(form.grade)} - {getSubjectText(form.subject)}
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <Typography variant="subtitle2" className="font-bold text-gray-700 mb-2">
                  Nội dung câu hỏi:
                </Typography>
                <div className="text-sm leading-relaxed">
                  <MathJaxHtml html={detailedQuestionData.question_content} />
                </div>
              </div>

              {detailedQuestionData.choices && detailedQuestionData.choices.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3">
                    Các lựa chọn:
                  </Typography>
                  <div className="space-y-2">
                    {detailedQuestionData.choices.map((choice: any, index: number) => (
                      <div key={index} className={`flex items-start gap-3 p-3 rounded border ${choice.is_correct === true ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${choice.is_correct === true
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-100 text-blue-600'
                          }`}>
                          <span className="text-black">{String.fromCharCode(65 + index)}</span>
                        </div>
                        <div className="flex-1 text-sm text-black">
                          <MathJaxHtml html={choice.content || choice.text || choice} />
                        </div>
                        {choice.is_correct === true && (
                          <Chip
                            label="Đáp án đúng"
                            color="success"
                            size="small"
                            className="font-bold"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(detailedQuestionData.correct_answer || detailedQuestionData.answer || detailedQuestionData.answers) && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Chip
                      label="Đáp án đúng"
                      color="success"
                      size="small"
                      className="font-bold"
                    />
                    <div className="text-sm leading-relaxed bg-white text-black p-3 rounded border border-green-200 flex-1">
                      <MathJaxHtml html={detailedQuestionData.correct_answer || detailedQuestionData.answer || detailedQuestionData.answers} />
                    </div>
                  </div>
                </div>
              )}

              {(detailedQuestionData.solution || detailedQuestionData.explanation || detailedQuestionData.solution_text) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <Typography variant="subtitle2" className="font-bold text-blue-800 mb-3">
                    Lời giải:
                  </Typography>
                  <div className="text-sm leading-relaxed bg-white p-3 rounded border">
                    <MathJaxHtml html={detailedQuestionData.solution || detailedQuestionData.explanation || detailedQuestionData.solution_text} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Typography variant="body2" className="font-semibold text-blue-800 mb-1">
                    Chương:
                  </Typography>
                  <Typography variant="body2" className="text-gray-700">
                    {detailedQuestionData.chapter?.chapter_name || detailedQuestionData.chapter_name || 'Chưa phân loại'}
                  </Typography>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <Typography variant="body2" className="font-semibold text-green-800 mb-1">
                    Bài học:
                  </Typography>
                  <Typography variant="body2" className="text-gray-700">
                    {detailedQuestionData.lesson?.name || detailedQuestionData.lesson_name || 'Chưa phân loại'}
                  </Typography>
                </div>
              </div>
            </div>
          ) : (
            <Typography variant="body2" className="text-gray-500 text-center py-8">
              Chọn một câu hỏi để xem chi tiết.
            </Typography>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-gray-50">
          <Button variant="outline-secondary" onClick={handleCloseQuestionDetailModal} size="sm">
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateTest;
