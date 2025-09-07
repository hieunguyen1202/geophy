import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import {
  Typography,
  Box,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import testService from '../../services/testService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import type { BaseListMenu } from '../../types';
import { renderMathWithText } from '../../utils';
import { MathJaxContext } from 'better-react-mathjax';
import { TestStatus, getStatusText } from '../../utils';
import { UNITY_HOST, UNITY_URL } from '../../api/apiConfig';

interface Choice {
  id: number;
  content: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  question_content: string;
  difficulty: number;
  question_type: number;
  simulation_data?: string;
  point: number;
  choices: Choice[];
  student_answer?: string | null;
  selected_choice_ids?: number[] | null;
}

interface TestDetail {
  test_assignment_id: number;
  test_id: number;
  title: string;
  description: string;
  total_score: number;
  subject: number;
  grade: number;
  created_by: number;
  created_at: string;
  duration: number;
  deadline: string;
  status: string;
  time_remaining: number; // minutes
  max_attempt?: number;
  attempt?: number;
  questions: Question[];
}

interface StudentTestDetailProps {
  listMenuUser: BaseListMenu[];
}

interface SubmissionResponse {
  message?: string[];
  [key: string]: unknown;
}

interface ApiError {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

const StudentTestDetail: React.FC<StudentTestDetailProps> = ({ listMenuUser }) => {
  const { testId } = useParams<{ testId: string }>();
  const location = useLocation();
  const initialStatus = location.state?.status || 0; // 1 = có bài dang dở
  const navigate = useNavigate();

  const [testDetail, setTestDetail] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Có thể tiếp tục hay không (thay cho dùng location.state trực tiếp)
  const [canResume, setCanResume] = useState<boolean>(initialStatus === 1);

  // đáp án đang làm bài
  const [answers, setAnswers] = useState<{ [questionId: number]: number[] | number | null }>({});

  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const [testScore, setTestScore] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Unity/iframe
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // ===== Helpers =====
  const buildInitialAnswersFromQuestions = useCallback((data: TestDetail) => {
    const init: { [key: number]: number[] | number | null } = {};
    data.questions.forEach((q) => {
      if (q.question_type === 1) {
        init[q.id] = Array.isArray(q.selected_choice_ids) ? q.selected_choice_ids : [];
      } else if (q.question_type === 0 || q.question_type === 3) {
        if (Array.isArray(q.selected_choice_ids) && q.selected_choice_ids.length > 0) {
          init[q.id] = q.selected_choice_ids[0];
        } else {
          init[q.id] = null;
        }
      } else {
        init[q.id] = null;
      }
    });
    return init;
  }, []);

  const formatAnswers = useCallback(() => {
    return (
      testDetail?.questions.map((question) => {
        const answer = answers[question.id];
        if (answer === null || answer === undefined) {
          return { question_id: question.id, answer: '', choice_id: [null] };
        }
        if (Array.isArray(answer)) {
          return { question_id: question.id, answer: '', choice_id: answer.length > 0 ? answer : [null] };
        }
        return {
          question_id: question.id,
          answer: typeof answer === 'string' ? answer : '',
          choice_id: typeof answer === 'number' ? [answer] : [null],
        };
      }) || []
    );
  }, [testDetail, answers]);

  const autoSaveProgress = useCallback(async (isManual = false) => {
    if (!testId || !isTestStarted) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const studentId = Number(localStorage.getItem('userId') || 0);
      const formattedAnswers = formatAnswers();

      const hasAnswers = formattedAnswers.some(a =>
        (Array.isArray(a.choice_id) && a.choice_id.some(id => id !== null)) ||
        a.choice_id !== null
      );
      if (!hasAnswers && !isManual) {
        setIsSaving(false);
        return;
      }

      const autoSaveData = {
        time_remaining: Math.ceil(timeLeft / 60),
        student_id: studentId,
        student_test_answers: formattedAnswers,
      };

      const res = await testService.autoSaveTest(Number(testId), autoSaveData);
      const apiMessages: string[] =
        Array.isArray((res as any)?.message) ? (res as any).message
          : (res as any)?.message ? [String((res as any).message)]
            : [];

      setLastSaved(new Date());

      if (isManual) {
        setSnackbarMessage(apiMessages.length ? apiMessages.join('\n') : 'Tiến trình đã được lưu thành công!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Error auto-saving test:', error);
      const errMsgs: string[] =
        Array.isArray(error?.response?.data?.message) ? error.response.data.message
          : error?.response?.data?.message ? [String(error.response.data.message)]
            : [error?.message || 'Không thể lưu tiến trình. Vui lòng thử lại.'];

      setSaveError(errMsgs[0]);

      if (isManual) {
        setSnackbarMessage(errMsgs.join('\n'));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setIsSaving(false);
    }
  }, [testId, formatAnswers, isTestStarted, timeLeft]);

  const handleManualSave = async () => { await autoSaveProgress(true); };

  const submitTestToAPI = useCallback(async (tid: number, studentId: number, student_test_answers: ReturnType<typeof formatAnswers>) => {
    const testSubmissionData = { test_id: tid, student_id: studentId, student_test_answers };
    return await testService.submitTest(tid, testSubmissionData);
  }, []);

  const handleSubmitTest = useCallback(async (_showSuccessMessage = true) => {
    if (!testId) {
      setSnackbarMessage('Test ID is missing');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const student_test_answers = formatAnswers();
      const studentId = Number(localStorage.getItem('userId') || 0);

      const response = await submitTestToAPI(Number(testId), studentId, student_test_answers) as SubmissionResponse;

      const testDetailResponse = await testService.getTestDetail(Number(testId));
      const updatedTestDetail = (testDetailResponse as any).data?.data || (testDetailResponse as any).data || testDetailResponse;
      setTestDetail(updatedTestDetail);

      const scoreMatch = response?.message && Array.isArray(response.message) && response.message.length > 0
        ? response.message[0].match(/(\d+(\.\d+)?)/)
        : null;

      if (scoreMatch) {
        setTestScore(parseFloat(scoreMatch[1]));
      } else if (updatedTestDetail?.total_score !== undefined) {
        setTestScore(updatedTestDetail.total_score);
      }

      // Sau khi nộp bài, quay về detail và chỉ hiển thị "Bắt đầu"
      setCanResume(false);
      setIsTestStarted(false);
    } catch (error) {
      console.error('Error submitting test:', error);
      const apiError = error as ApiError;
      const raw = apiError?.response?.data?.message;
      const errorMessage = Array.isArray(raw) ? raw.join('\n') : (raw || 'Nộp bài thất bại. Vui lòng thử lại.');
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [testId, formatAnswers, submitTestToAPI]);

  const confirmSubmitTest = async () => {
    setShowConfirmDialog(false);
    await handleSubmitTest(true);
  };

  // ===== Simulation helpers =====
  const [_selectedSimulation, setSelectedSimulation] = useState<string | null>(null);
  const [isSimVisible, setIsSimVisible] = useState(false);
  const [isSimLoading, setIsSimLoading] = useState(false);
  useEffect(() => {
    if (!isSimLoading) return;
    const id = setTimeout(() => setIsSimLoading(false), 12000);
    return () => clearTimeout(id);
  }, [isSimLoading]);

  const getToolNameFromSimulationData = (raw?: string): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'N/A') return null;
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj.tool === 'string' && obj.tool.trim()) return obj.tool.trim();
    } catch { }
    return trimmed;
  };

  const loadSimulation = (toolName: string) => {
    setSelectedSimulation(toolName);
    setIsSimVisible(true);
    setIsSimLoading(true);
  };

  const handleHideSimulation = () => setIsSimVisible(false);

  useEffect(() => {
    setIsSimVisible(false);
    setSelectedSimulation(null);
    setIsSimLoading(false);
    setIframeReady(false);
    setUnityListenerReady(false);
  }, [currentQuestionIndex]);

  // ===== ONLY getTestDetail on mount =====
  useEffect(() => {
    const fetchTestDetail = async () => {
      if (!testId) {
        setError('Test ID is missing');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await testService.getTestDetail(Number(testId));
        const data = (response as any).data?.data || (response as any).data || response;
        setTestDetail(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to load test detail');
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetail();
  }, [testId]);

  // ===== Timer tick =====
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTestStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isTestStarted, timeLeft, handleSubmitTest]);

  // Auto-save interval
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;
    if (isTestStarted && testId) {
      autoSaveInterval = setInterval(() => {
        autoSaveProgress();
      }, 30000);
    }
    return () => { clearInterval(autoSaveInterval); };
  }, [isTestStarted, testId, autoSaveProgress]);

  // Save on unload/visibility
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTestStarted && testId) {
        autoSaveProgress();
        e.preventDefault();
        e.returnValue = 'Bạn có chắc chắn muốn rời khỏi? Tiến trình sẽ được tự động lưu.';
        return e.returnValue;
      }
    };

    const handleUnload = () => {
      if (isTestStarted && testId) autoSaveProgress();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    const handleVisibilityChange = () => {
      if (document.hidden && isTestStarted && testId) autoSaveProgress();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTestStarted, testId, autoSaveProgress]);

  const getSubjectText = (subject: number) => {
    switch (subject) {
      case 0: return 'Toán học';
      case 1: return 'Vật lý';
      default: return 'Không xác định';
    }
  };

  const getGradeText = (grade: number) => {
    switch (grade) {
      case 0: return 'Lớp 10';
      case 1: return 'Lớp 11';
      case 2: return 'Lớp 12';
      default: return 'Không xác định';
    }
  };

  const getQuestionTypeText = (type: number) => {
    switch (type) {
      case 0: return 'Một lựa chọn';
      case 1: return 'Nhiều lựa chọn';
      case 2: return 'Điền vào chỗ trống';
      case 3: return 'Đúng/Sai';
      case 4: return 'Mô phỏng';
      case 5: return 'Tự luận';
      default: return 'Không xác định';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * 🚩 Quan trọng (đáp ứng yêu cầu):
   * - Chỉ gọi doTest khi bấm nút.
   * - Với mode = 0, nếu response chứa message -> hiển thị TẤT CẢ message bằng Snackbar.
   * - Nếu có "Bạn đã làm quá số lần cho phép" -> KHÔNG vào màn làm bài (ở lại detail).
   * - Sau submit thành công -> canResume = false => detail chỉ hiện "Bắt đầu".
   */
  const startTestByMode = useCallback(async (mode: 0 | 1) => {
    if (!testId) return;
    try {
      setLoading(true);

      const response = await testService.doTest(Number(testId), mode);
      const resp = (response as any);

      // Gom tất cả messages có thể có trong response
      const msgArr: string[] | undefined =
        Array.isArray(resp?.data?.message) ? resp.data.message
          : Array.isArray(resp?.message) ? resp.message
            : undefined;

      // Với mode=0: luôn show tất cả message nếu có
      if (mode === 0 && msgArr?.length) {
        const joined = msgArr.join('\n');
        const isOverAttempt = msgArr.some(m => m?.includes('Bạn đã làm quá số lần cho phép'));
        setSnackbarMessage(joined);
        setSnackbarSeverity(isOverAttempt ? 'error' : 'info');
        setSnackbarOpen(true);

        // Nếu quá số lần cho phép -> dừng tại màn detail, không vào bài
        if (isOverAttempt) return;
      }

      const data: TestDetail = resp.data?.data || resp.data || resp;

      // Prefill answers từ selected_choice_ids
      const initAnswers = buildInitialAnswersFromQuestions(data);
      setAnswers(initAnswers);

      setTestDetail(data);

      const minutes = typeof data.time_remaining === 'number' ? data.time_remaining / 60 : data.duration / 60;
      setTimeLeft(Math.max(0, Math.floor(minutes * 60)));

      setCurrentQuestionIndex(0);
      setIsTestStarted(true);
      setTestScore(null);
    } catch (err: any) {
      // Thu thập tất cả messages bên trong error
      const raw = err?.response?.data?.message;
      const msgs: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [err?.message || 'Không thể bắt đầu bài làm. Vui lòng thử lại.'];

      // Với mode=0: luôn hiển thị ở màn detail và không vào bài
      if (mode === 0) {
        setSnackbarMessage(msgs.join('\n'));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // mode=1: báo lỗi khi tiếp tục
      setSnackbarMessage(msgs.join('\n'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [testId, buildInitialAnswersFromQuestions]);

  const handleStartTest = () => {
    if (!testDetail) return;

    if (testDetail.time_remaining < 0) {
      setSnackbarMessage('Thời gian làm bài đã hết. Bạn không thể tiếp tục làm bài.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (canResume) {
      setResumeDialogOpen(true);
      return;
    }

    // Bắt đầu mới (mode = 0)
    startTestByMode(0);
  };

  // ===== Unity messaging =====
  function normalizeSimData(raw: unknown) {
    if (raw == null) return null;
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return null;
      try { return JSON.parse(s); } catch { return s; }
    }
    return raw;
  }

  const currentQuestion = testDetail?.questions[currentQuestionIndex];
  const simPayload = useMemo(
    () => normalizeSimData(currentQuestion?.simulation_data),
    [currentQuestion?.simulation_data]
  );
  const simPayloadRef = useRef<unknown>(null);
  useEffect(() => { simPayloadRef.current = simPayload; }, [simPayload]);
  const [_iframeReady, setIframeReady] = useState(false);
  const [_unityListenerReady, setUnityListenerReady] = useState(false);

  const onIframeLoad = () => {
    setIframeReady(true);
    setIsSimLoading(false);
    iframeRef.current?.contentWindow?.postMessage({ type: 'PING' }, UNITY_HOST);
  };

  function sendSimulationOnce(data: unknown) {
    if (!iframeRef.current?.contentWindow) {
      console.warn('[React] iframe contentWindow chưa sẵn sàng');
      return;
    }
    iframeRef.current.contentWindow.postMessage(data, UNITY_HOST);
    console.log('[React] Sent SIMULATION_DATA ->', UNITY_HOST, data);
  }

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== UNITY_HOST) return;

      if (e.data?.type === 'UNITY_LISTENER_READY') {
        setUnityListenerReady(true);
      }

      if (e.data?.type === 'UNITY_INSTANCE_READY') {
        setUnityListenerReady(true);

        if (!isSimVisible) return;
        const data = simPayloadRef.current;
        if (data == null) return;

        sendSimulationOnce(data);
        let tries = 0;
        const maxTries = 3;
        const id = setInterval(() => {
          tries++;
          if (tries > maxTries) {
            clearInterval(id);
            return;
          }
          sendSimulationOnce(data);
        }, 800);
      }

      if (e.data?.type === 'SIMULATION_ACK') {
        // ACK
      }
    };

    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [isSimVisible]);

  // ===== Render =====
  if (!isTestStarted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
        <Navbar listMenuUser={listMenuUser} />
        <Container className="py-4 flex-grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner animation="border" variant="primary" className="h-12 w-12" />
              <Typography variant="body1" className="mt-4 text-gray-600">
                Đang tải chi tiết bài luyện tập...
              </Typography>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <Typography color="error" variant="body1">{error}</Typography>
            </div>
          ) : testDetail ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/student-test-list')}
                  sx={{
                    color: '#f37021',
                    borderColor: '#f37021',
                    '&:hover': { backgroundColor: '#f37021', color: 'white' },
                  }}
                >
                  ← Quay lại danh sách bài luyện tập
                </Button>
              </div>

              {testScore !== null && (
                <Paper elevation={4} sx={{ mb: 4, p: 4, backgroundColor: '#e6f4ea', borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold', mb: 2 }}>
                    🎉 Chúc mừng bạn đã hoàn thành bài luyện tập!
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'success.dark', fontWeight: 'bolder', mb: 1 }}>
                    {Number(testScore.toFixed(1))} điểm
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Đây là điểm số cuối cùng của bạn.
                  </Typography>
                </Paper>
              )}

              <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                <Box sx={{ backgroundColor: '#f37021', color: 'white', p: 4, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {testDetail.title}
                  </Typography>
                  {testDetail.description && (
                    <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 300 }}>
                      {testDetail.description}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ p: 4 }}>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <Paper elevation={1} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#f37021' }}>Thông tin cơ bản</Typography>
                        <div className="space-y-2">
                          <div className="d-flex justify-content-between">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Lớp:</Typography>
                            <Typography variant="body1">{getGradeText(testDetail.grade)}</Typography>
                          </div>
                          <div className="d-flex justify-content-between">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Môn học:</Typography>
                            <Typography variant="body1">{getSubjectText(testDetail.subject)}</Typography>
                          </div>
                          <div className="d-flex justify-content-between">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Số câu hỏi:</Typography>
                            <Typography variant="body1">{testDetail.questions.length} câu</Typography>
                          </div>
                          <div className="d-flex justify-content-between">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Điểm tối đa:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#f37021' }}>10 điểm</Typography>
                          </div>
                        </div>
                      </Paper>
                    </div>

                    <div className="col-md-6">
                      <Paper elevation={1} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#f37021' }}>Thời gian & Deadline</Typography>
                        <div className="space-y-2">
                          <div className="d-flex justify-content-between">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Thời lượng:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {Math.floor(testDetail.duration / 60)} phút
                            </Typography>
                          </div>
                          <div className="d-flex justify-content-between">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Số lần làm tối đa:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{testDetail.max_attempt ? testDetail.max_attempt : testDetail.attempt} lần</Typography>
                          </div>
                          <div className="d-flex justify-content-between align-items-start">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Hạn nộp:</Typography>
                            <div className="text-end">
                              <Typography variant="body1">
                                {testDetail.deadline
                                  ? `${new Date(testDetail.deadline).toLocaleDateString('vi-VN')} ${new Date(testDetail.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                                  : 'Không thời hạn'}
                              </Typography>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between">
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Trạng thái:</Typography>
                            <Typography
                              component="span"
                              sx={{ display: 'inline-block' }}
                              className={`px-2 py-1 rounded-full text-xs ${testDetail.status === '2'
                                ? 'bg-green-100 text-green-800'
                                : testDetail.status === '1'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {getStatusText(testDetail.status as unknown as TestStatus)}
                            </Typography>
                          </div>
                        </div>
                      </Paper>
                    </div>
                  </div>

                  <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2, backgroundColor: '#fff8f0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#f37021' }}>Hướng dẫn làm bài</Typography>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li><Typography variant="body2" sx={{ mb: 1 }}>Thời gian làm bài là <strong> {Math.floor(testDetail.duration / 60)} phút</strong>, đồng hồ đếm ngược sẽ bắt đầu khi bạn nhấn "Bắt đầu"</Typography></li>
                      <li><Typography variant="body2" sx={{ mb: 1 }}>Bài luyện tập có <strong>{testDetail.questions.length} câu hỏi</strong> với tổng điểm <strong>10 điểm</strong></Typography></li>
                      <li><Typography variant="body2" sx={{ mb: 1 }}>Bạn có thể chuyển đổi giữa các câu hỏi và thay đổi câu trả lời trong thời gian làm bài</Typography></li>
                      <li><Typography variant="body2" sx={{ mb: 1 }}><strong>Tiến trình sẽ được tự động lưu</strong> - nếu thoát giữa chừng, bạn có thể tiếp tục làm bài từ nơi đã dừng</Typography></li>
                      <li><Typography variant="body2" sx={{ mb: 1 }}>Nhấn "Nộp bài" khi hoàn thành hoặc bài sẽ tự động được nộp khi hết thời gian</Typography></li>
                      <li><Typography variant="body2">Sau khi nộp bài, bạn không thể chỉnh sửa câu trả lời</Typography></li>
                    </ul>
                  </Paper>

                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleStartTest}
                      sx={{
                        backgroundColor: '#f37021',
                        '&:hover': { backgroundColor: '#e55a0e' },
                        px: 6, py: 2, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 2
                      }}
                    >
                      {canResume ? 'Tiếp tục làm bài' : 'Bắt đầu'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </div>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" className="text-gray-500" sx={{ mb: 2 }}>Không tìm thấy chi tiết bài luyện tập</Typography>
              <Typography variant="body2" color="textSecondary">Vui lòng thử lại sau hoặc liên hệ hỗ trợ</Typography>
            </Box>
          )}
        </Container>

        {/* Dialog hỏi Tiếp tục / Bắt đầu mới */}
        <Dialog open={resumeDialogOpen} onClose={() => setResumeDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f37021' }}>
              Bạn muốn tiếp tục hay bắt đầu mới?
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Hệ thống ghi nhận bạn đang có bài làm dở. Hãy chọn một trong hai tuỳ chọn bên dưới.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => { setResumeDialogOpen(false); startTestByMode(0); }}
              sx={{ borderColor: '#6c757d', color: '#6c757d', '&:hover': { bgcolor: '#6c757d', color: '#fff' } }}
            >
              Bắt đầu bài mới
            </Button>
            <Button
              variant="contained"
              onClick={() => { setResumeDialogOpen(false); startTestByMode(1); }}
              sx={{ backgroundColor: '#f37021', '&:hover': { backgroundColor: '#e55a0e' } }}
            >
              Tiếp tục bài đang làm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar (hiển thị mọi thông báo/ lỗi ở màn detail) */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ top: { xs: 70, sm: 70 } }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <Footer listMenuUser={listMenuUser} />
      </div>
    );
  }

  // ===== Giao diện làm bài =====
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar listMenuUser={listMenuUser} />
      <Container className="py-4 flex-grow">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3">
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', position: 'sticky', top: 20 }}>
              <Box sx={{ background: 'linear-gradient(135deg, #f37021  0%, #f57c20  100%)', color: 'white', p: 3, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>⏰ Thời gian còn lại</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: 'monospace', color: timeLeft <= 300 ? '#ffeb3b' : timeLeft <= 60 ? '#f44336' : 'inherit' }}>
                  {formatTime(timeLeft)}
                </Typography>
                {timeLeft <= 300 && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.9 }}>
                    {timeLeft <= 60 ? '⚠️ Sắp hết thời gian!' : '⏳ Còn ít thời gian'}
                  </Typography>
                )}
              </Box>

              <Box sx={{ p: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>Tiến độ làm bài</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {testDetail?.questions.filter(q => {
                        const a = answers[q.id];
                        return (Array.isArray(a) ? a.length > 0 : a !== null && a !== undefined);
                      }).length || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Đã làm</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {testDetail?.questions.filter(q => {
                        const a = answers[q.id];
                        return !(Array.isArray(a) ? a.length > 0 : a !== null && a !== undefined);
                      }).length || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Chưa làm</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {testDetail?.questions.length || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Tổng số</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>Danh sách câu hỏi</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, mb: 3 }}>
                  {testDetail?.questions.map((q, index) => {
                    const a = answers[q.id];
                    const status = (Array.isArray(a) ? a.length > 0 : a !== null && a !== undefined) ? 'answered' : 'unanswered';
                    const isActive = index === currentQuestionIndex;
                    return (
                      <Box
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        sx={{
                          width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease',
                          border: '2px solid',
                          borderColor: isActive ? 'primary.main' : status === 'answered' ? 'success.main' : 'grey.300',
                          backgroundColor: isActive ? 'primary.main' : status === 'answered' ? 'success.main' : 'white',
                          color: isActive || status === 'answered' ? 'white' : 'text.primary',
                          boxShadow: isActive ? '0 4px 12px rgba(25, 118, 210, 0.4)'
                            : status === 'answered' ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isActive ? '0 6px 16px rgba(25, 118, 210, 0.5)'
                              : status === 'answered' ? '0 4px 12px rgba(76, 175, 80, 0.4)'
                                : '0 2px 8px rgba(0, 0, 0, 0.2)',
                          }
                        }}
                      >
                        {index + 1}
                      </Box>
                    );
                  })}
                </Box>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={handleManualSave}
                  disabled={isSaving}
                  sx={{
                    borderColor: '#4caf50', color: '#4caf50', '&:hover': { backgroundColor: '#4caf50', color: 'white' },
                    mb: 2, fontWeight: 'bold',
                  }}
                >
                  {isSaving ? 'Đang lưu...' : '💾 Lưu tiến trình'}
                </Button>

                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  {isSaving ? (
                    <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 'bold' }}>⏳ Đang lưu tiến trình...</Typography>
                  ) : lastSaved ? (
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>✅ Đã lưu lúc {lastSaved.toLocaleTimeString('vi-VN')}</Typography>
                  ) : saveError ? (
                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold' }}>❌ {saveError}</Typography>
                  ) : (
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>✅ Tiến trình được tự động lưu</Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => setShowConfirmDialog(true)}
                  sx={{ backgroundColor: '#f37021', '&:hover': { backgroundColor: '#e55a0e' }, fontWeight: 'bold' }}
                >
                  Nộp bài
                </Button>
              </Box>
            </Paper>
          </div>

          {/* Nội dung câu hỏi */}
          <div className="col-md-9">
            {currentQuestion && (
              <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Câu {currentQuestionIndex + 1} / {testDetail?.questions.length}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    <Chip label={getQuestionTypeText(currentQuestion.question_type)} color="primary" size="small" sx={{ backgroundColor: '#f37021' }} />
                  </Box>
                  <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                      <MathJaxContext>
                        <div>{renderMathWithText(currentQuestion.question_content ?? '')}</div>
                      </MathJaxContext>
                    </Typography>
                  </Paper>

                  {/* UNITY SIMULATION */}
                  {(() => {
                    const toolName = getToolNameFromSimulationData(currentQuestion?.simulation_data);
                    if (!toolName) return null;

                    return (
                      <Box sx={{ mb: 3 }}>
                        {!isSimVisible ? (
                          <Button
                            variant="contained"
                            onClick={() => loadSimulation(toolName)}
                            sx={{ backgroundColor: '#f37021', '&:hover': { backgroundColor: '#e55a0e' }, fontWeight: 'bold', mb: 2 }}
                          >
                            🔧 Mở mô phỏng Unity
                          </Button>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Tooltip title="Thu gọn">
                              <IconButton
                                onClick={handleHideSimulation}
                                sx={{ border: '1px solid #6c757d', color: '#6c757d', '&:hover': { bgcolor: '#6c757d', color: '#fff' }, borderRadius: 1 }}
                              >
                                <ExpandLessIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Tải lại mô phỏng">
                              <IconButton
                                onClick={() => {
                                  setIsSimLoading(true);
                                  setUnityListenerReady(false);
                                  setIframeReady(false);
                                  setReloadToken(t => t + 1);
                                }}
                                sx={{ border: '1px solid #f37021', color: '#f37021', '&:hover': { bgcolor: '#f37021', color: '#fff' }, borderRadius: 1 }}
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}

                        {isSimVisible && (
                          <Box sx={{ position: 'relative' }}>
                            {isSimLoading && (
                              <Box
                                sx={{
                                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1, borderRadius: 1
                                }}
                              >
                                <Spinner animation="border" variant="warning" />
                                <Typography sx={{ ml: 1, color: '#f37021', fontWeight: 600 }}>Đang tải mô phỏng...</Typography>
                              </Box>
                            )}
                            <Box
                              component="iframe"
                              ref={iframeRef}
                              title="Unity WebGL Simulation"
                              src={`${UNITY_URL}${UNITY_URL.includes('?') ? '&' : '?'}rt=${reloadToken}`}
                              sx={{ width: '100%', height: '500px', border: 'none', display: 'block', borderRadius: 1 }}
                              onLoad={onIframeLoad}
                              allow="fullscreen; xr-spatial-tracking; clipboard-read; clipboard-write"
                              allowFullScreen
                            />
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
                  {/* /UNITY SIMULATION */}
                </Box>

                <Box sx={{ mb: 4 }}>
                  <MathJaxContext>
                    {(() => {
                      const answer = answers[currentQuestion.id];
                      const tfAnswer: boolean | null = answers[currentQuestion.id] as unknown as boolean | null;
                      switch (currentQuestion.question_type) {
                        case 0: // Một lựa chọn
                          return (
                            <RadioGroup
                              value={answer || ''}
                              onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: Number(e.target.value) }))}
                            >
                              {currentQuestion.choices.map((choice) => (
                                <FormControlLabel
                                  key={choice.id}
                                  value={choice.id}
                                  control={<Radio />}
                                  label={renderMathWithText(choice.content)}
                                />
                              ))}
                            </RadioGroup>
                          );
                        case 1: // Nhiều lựa chọn
                          return (
                            <FormGroup>
                              {currentQuestion.choices.map((choice) => (
                                <FormControlLabel
                                  key={choice.id}
                                  control={
                                    <Checkbox
                                      checked={(answer as number[] || []).includes(choice.id)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setAnswers(prev => {
                                          const cur = (prev[currentQuestion.id] as number[]) || [];
                                          return {
                                            ...prev,
                                            [currentQuestion.id]: checked
                                              ? [...cur, choice.id]
                                              : cur.filter(id => id !== choice.id)
                                          };
                                        });
                                      }}
                                    />
                                  }
                                  label={renderMathWithText(choice.content)}
                                />
                              ))}
                            </FormGroup>
                          );
                        case 3: // Đúng/Sai
                          return (
                            <RadioGroup
                              value={
                                tfAnswer === true ? 'true' :
                                  tfAnswer === false ? 'false' :
                                    undefined
                              }
                              onChange={(e) => {
                                const value = e.target.value === 'true';
                                const q = testDetail?.questions.find(q => q.id === currentQuestion.id);
                                if (q && q.choices.length >= 2) {
                                  const choiceId = value ? q.choices[0].id : q.choices[1].id;
                                  setAnswers(prev => ({ ...prev, [currentQuestion.id]: choiceId }));
                                }
                              }}
                            >
                              <FormControlLabel value="true" control={<Radio />} label="Đúng" />
                              <FormControlLabel value="false" control={<Radio />} label="Sai" />
                            </RadioGroup>
                          );
                        default:
                          return (
                            <Typography color="textSecondary">
                              Loại câu hỏi này chưa được hỗ trợ: {getQuestionTypeText(currentQuestion.question_type)}
                            </Typography>
                          );
                      }
                    })()}
                  </MathJaxContext>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    sx={{ borderColor: '#f37021', color: '#f37021', '&:hover': { backgroundColor: '#f37021', color: 'white' } }}
                  >
                    ← Câu trước
                  </Button>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Trạng thái:{' '}
                      {(() => {
                        const a = answers[currentQuestion.id];
                        const answered = Array.isArray(a) ? a.length > 0 : a !== null && a !== undefined;
                        return answered
                          ? <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Đã trả lời</span>
                          : <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Chưa trả lời</span>;
                      })()}
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    disabled={currentQuestionIndex === (testDetail?.questions.length || 0) - 1}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    sx={{ borderColor: '#f37021', color: '#f37021', '&:hover': { backgroundColor: '#f37021', color: 'white' } }}
                  >
                    Câu tiếp theo →
                  </Button>
                </Box>
              </Paper>
            )}
          </div>
        </div>
      </Container>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f37021' }}>
            <span>Xác nhận nộp bài</span>
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Bạn có chắc chắn muốn nộp bài luyện tập? Sau khi nộp, bạn không thể chỉnh sửa câu trả lời.
            </Typography>

            <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Tổng quan bài làm:</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {testDetail?.questions.filter(q => {
                      const a = answers[q.id];
                      return (Array.isArray(a) ? a.length > 0 : a !== null && a !== undefined);
                    }).length || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Đã trả lời</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {testDetail?.questions.filter(q => {
                      const a = answers[q.id];
                      return !(Array.isArray(a) ? a.length > 0 : a !== null && a !== undefined);
                    }).length || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Chưa trả lời</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {testDetail?.questions.length || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Tổng cộng</Typography>
                </Box>
              </Box>
            </Paper>

            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Thời gian còn lại: <strong>{formatTime(timeLeft)}</strong>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            onClick={() => setShowConfirmDialog(false)}
            variant="outlined"
            sx={{ borderColor: '#6c757d', color: '#6c757d', '&:hover': { backgroundColor: '#6c757d', color: 'white' } }}
          >
            Hủy
          </Button>
          <Button
            onClick={confirmSubmitTest}
            variant="contained"
            sx={{ backgroundColor: '#f37021', '&:hover': { backgroundColor: '#e55a0e' }, px: 4 }}
          >
            Xác nhận nộp bài
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar (hiển thị mọi thông báo/ lỗi trong chế độ làm bài nếu cần) */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: { xs: 70, sm: 70 } }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Footer listMenuUser={listMenuUser} />
    </div>
  );
};

export default StudentTestDetail;
