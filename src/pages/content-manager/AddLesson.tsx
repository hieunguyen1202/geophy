import React, { useEffect, useMemo, useState } from 'react';
import { Container, Button, Form } from 'react-bootstrap';
import ContentManagerSidebar from '../../components/layout/ContentManagerSidebar';
import ContentManagerNavbar from '../../components/layout/ContentManagerNavbar';
import ContentManagerFooter from '../../components/layout/ContentManagerFooter';
import { Link as ReactRouterLink, useNavigate } from 'react-router-dom';
import Link from '@mui/material/Link';
import { Typography, Card } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import chapterService from '../../services/chapterService';
import lessonService, { type LessonPayload } from '../../services/lessonService';
import { FaGraduationCap, FaBook, FaListUl, FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import { UNITY_URL } from '../../api/apiConfig';

const gradeLabels: Record<number, string> = { 0: 'Lớp 10', 1: 'Lớp 11', 2: 'Lớp 12' };
const subjectLabels: Record<number, string> = { 0: 'Toán học', 1: 'Vật lý' };
type ChapterLite = { id: number; chapter_name: string };

// ➕ Mở rộng payload để thêm simulation_key optional
type LessonPayloadWithSimKey = LessonPayload & {
  simulation_key?: string;
};

const AddLesson: React.FC = () => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ---- FILTERS ----
  const [filterGrade, setFilterGrade] = useState<'all' | 0 | 1 | 2>('all');
  const [filterSubject, setFilterSubject] = useState<'all' | 0 | 1>('all');
  const [chapters, setChapters] = useState<ChapterLite[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | 'all'>('all');
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // ---- FORM ----
  const [form, setForm] = useState({
    name: '',
    description: '',
    content: '',
    lesson_number: 1,
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ---- PHYSICS SIMULATION DROPDOWN (only when subject = 1) ----
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');

  // ---- TOAST ----
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // ---- UNITY RELOAD ----
  const [unityKey, setUnityKey] = useState(0);
  const [unitySrc, setUnitySrc] = useState(`${UNITY_URL}`);

  // ---- SIMULATION DATA (lưu dưới dạng CHUỖI JSON) ----
  const [simulationData, setSimulationData] = useState<string | null>(null);
  const [simulationSaved, setSimulationSaved] = useState(false);

  // ---- ERRORS ----
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    chapter_id?: string;
    lesson_number?: string;
  }>({});

  // ===================== Load initial filters from localStorage =====================
  useEffect(() => {
    const savedGrade = localStorage.getItem('selectedGradeLesson');
    const savedSubject = localStorage.getItem('selectedSubjectLesson');
    const savedChapter = localStorage.getItem('selectedChapterLesson');

    if (savedGrade !== null) {
      setFilterGrade(Number(savedGrade) as 0 | 1 | 2);
      setActiveStep(1);
    }
    if (savedSubject !== null) {
      setFilterSubject(Number(savedSubject) as 0 | 1);
      setActiveStep(2);
    }
    if (savedChapter !== null) {
      setSelectedChapter(Number(savedChapter));
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (filterGrade !== 'all') localStorage.setItem('selectedGradeLesson', String(filterGrade));
    if (filterSubject !== 'all') localStorage.setItem('selectedSubjectLesson', String(filterSubject));
  }, [filterGrade, filterSubject]);

  useEffect(() => {
    if (selectedChapter !== 'all') {
      localStorage.setItem('selectedChapterLesson', String(selectedChapter));
    }
  }, [selectedChapter]);

  // Fetch chapters when filter changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (filterGrade === 'all' || filterSubject === 'all') {
        setChapters([]);
        setSelectedChapter('all');
        return;
      }
      setIsLoadingChapters(true);
      try {
        const { list } = await chapterService.getChapters({
          page: 0,
          size: 1000,
          grade: filterGrade,
          subject: filterSubject,
        });
        setChapters(list || []);
        setSelectedChapter(list && list.length > 0 ? list[0].id : 'all');
      } catch {
        setChapters([]);
        setSelectedChapter('all');
        setSnackbarMessage('Không thể tải danh sách chương!');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsLoadingChapters(false);
      }
    };
    fetchChapters();
  }, [filterGrade, filterSubject]);

  // ---- VALIDATE ----
  const validate = () => {
    const next: typeof errors = {};

    const nameTrim = form.name.trim();
    if (!nameTrim) {
      next.name = 'Tên bài học không được để trống';
    } else if (nameTrim.length > 255) {
      next.name = 'Tên bài học không được vượt quá 255 ký tự';
    }

    if (form.description && form.description.length > 255) {
      next.description = 'Mô tả bài học không được vượt quá 255 ký tự';
    }

    if (form.lesson_number == null || Number(form.lesson_number) < 1) {
      next.lesson_number = 'Số thứ tự bài học không hợp lệ';
    }

    setErrors(next);
    return next;
  };

  const canSave = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      selectedChapter !== 'all' &&
      filterGrade !== 'all' &&
      filterSubject !== 'all'
    );
  }, [form.name, selectedChapter, filterGrade, filterSubject]);

  // ===================== Helpers: unwrap + chuẩn hoá thành chuỗi JSON =====================
  const unwrapUnityPayload = (payload: any): any => {
    // Các kiểu khung phổ biến mà Unity/WebGL có thể gửi
    if (payload && typeof payload === 'object' && payload.type === 'object_saved') {
      return payload.data;
    }
    if (payload && typeof payload === 'object' && payload.payload && payload.payload.type === 'object_saved') {
      return payload.payload.data;
    }
    return payload;
  };

  const normalizeToJsonString = (raw: any): string | null => {
    try {
      let core: any = unwrapUnityPayload(raw);

      // Nếu Unity gửi string -> thử parse để đảm bảo hợp lệ, sau đó stringify lại
      if (typeof core === 'string') {
        // Có thể là chuỗi JSON, hoặc đối tượng bọc { data: '...' }
        try {
          const parsed = JSON.parse(core);
          return JSON.stringify(parsed);
        } catch {
          // Nếu không phải JSON hợp lệ, từ chối để tránh lưu rác
          // setSnackbarMessage('Lỗi: Dữ liệu mô phỏng không phải JSON hợp lệ!');
          // setSnackbarSeverity('error');
          // setSnackbarOpen(true);
          return null;
        }
      }

      // Nếu dạng { data: '...json...' }
      if (core && typeof core === 'object' && typeof core.data === 'string') {
        try {
          const nested = JSON.parse(core.data);
          return JSON.stringify(nested);
        } catch {
          setSnackbarMessage('Lỗi: Dữ liệu mô phỏng lồng bên trong không hợp lệ!');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return null;
        }
      }

      // Nếu là object bất kỳ -> stringify trực tiếp
      if (core && typeof core === 'object') {
        return JSON.stringify(core);
      }

      setSnackbarMessage('Lỗi: Không thể xử lý dữ liệu mô phỏng!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return null;
    } catch {
      setSnackbarMessage('Lỗi: Không thể xử lý dữ liệu mô phỏng!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return null;
    }
  };

  // ===================== Lưu simulation_data từ WebGL =====================
  const saveSimulationData = (payloadAny: any) => {
    const jsonStr = normalizeToJsonString(payloadAny);
    if (!jsonStr) return;

    setSimulationData(jsonStr);
    setSimulationSaved(true);
    // setSnackbarMessage('Đã lưu dữ liệu mô phỏng từ Unity.');
    // setSnackbarSeverity('success');
    // setSnackbarOpen(true);
  };

  // ===================== Nhận message từ Unity iframe =====================
  useEffect(() => {
    const handleUnityMessage = (event: MessageEvent) => {
      // 1) Unity báo ready và gửi payload dạng chuỗi
      if (event.data?.type === 'unity-ready' && event.data.payload) {
        saveSimulationData(event.data.payload);
        return;
      }

      // 2) Một số biến thể thông điệp
      if (event.data?.type === 'UNITY_OBJECT_SAVED') {
        saveSimulationData(event.data.payload);
        return;
      }
      if (event.data?.type === 'UNITY_MESSAGE' && event.data.payload?.type === 'object_saved') {
        saveSimulationData(event.data.payload);
        return;
      }
      if (event.data?.type === 'UNITY_RAW_MESSAGE') {
        saveSimulationData(event.data.payload);
        return;
      }

      // 3) Fallback: nếu event.data là object/string có vẻ là JSON -> thử luôn
      if (event.data) {
        saveSimulationData(event.data);
        return;
      }
    };

    window.addEventListener('message', handleUnityMessage);
    return () => window.removeEventListener('message', handleUnityMessage);
  }, []);

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const payload: LessonPayloadWithSimKey = {
        name: form.name.trim(),
        description: form.description.trim(),
        content: form.content.trim(),
        chapter_id: Number(selectedChapter),
        lesson_number: form.lesson_number,
        // ✅ Gửi simulation_data (đã là chuỗi JSON)
        ...(simulationData ? { simulation_data: simulationData } : {}),
        // ✅ Gửi simulation_key khi subject = 1 (Vật lý) và đã chọn mô phỏng
        ...(filterSubject === 1 && selectedSimulation ? { simulation_key: selectedSimulation } : {}),
      };

      await lessonService.addLesson(payload, file);
      setSnackbarMessage('Thêm bài học thành công!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate('/content-manager/lesson'), 800);
    } catch (error: unknown) {
      type ErrorResponse = {
        response?: {
          data?: {
            message?: string | string[];
            messages?: string | string[];
            detailMessage?: string;
          };
        };
      };

      const err = error as ErrorResponse;
      const data = err.response?.data;

      let errorMessage: string | undefined;
      if (data?.message) errorMessage = Array.isArray(data.message) ? data.message.join(' ') : data.message;
      else if (data?.messages) errorMessage = Array.isArray(data.messages) ? data.messages.join(' ') : data.messages;
      else if (data?.detailMessage) errorMessage = data.detailMessage;

      setSnackbarMessage(errorMessage || 'Thêm bài học thất bại!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- CLEAR SIMULATION DATA ----
  const clearSimulationData = () => {
    setSimulationData(null);
    setSimulationSaved(false);
    setSnackbarMessage('Đã xóa dữ liệu mô phỏng!');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  // ---- UNITY reload ----
  const handleUnityReload = () => {
    setSimulationData(null);
    setSimulationSaved(false);
    const ts = Date.now();
    setUnitySrc(`${UNITY_URL}?t=${ts}`);
    setUnityKey((k) => k + 1);
  };

  // ---- SIMULATIONS LIST (cho Vật lý) ----
  const simulations = [
    { id: 'Acceleration', title: 'Gia tốc', description: '...', category: 'Động lực học', icon: '🏃‍♂️', color: '#e3f2fd' },
    { id: 'ChangeMachanicalEnergy', title: 'Biến đổi năng lượng cơ học', description: '...', category: 'Năng lượng', icon: '⚡', color: '#fff3e0' },
    { id: 'CircularMotion', title: 'Chuyển động tròn', description: '...', category: 'Động học', icon: '🌀', color: '#f3e5f5' },
    { id: 'ElectricForce', title: 'Lực điện', description: '...', category: 'Điện học', icon: '⚡', color: '#e8f5e8' },
    { id: 'FreeFall', title: 'Rơi tự do', description: '...', category: 'Cơ học', icon: '📉', color: '#ffebee' },
    { id: 'ProjectileMotion', title: 'Chuyển động ném xiên', description: '...', category: 'Động học', icon: '🏹', color: '#fff8e1' },
    { id: 'Springs', title: 'Biến dạng của vật rắn', description: '...', category: 'Biến dạng của vật rắn', icon: '🏹', color: '#fff8e1' },
  ];

  return (
    <>
      <ContentManagerSidebar onCollapse={setSidebarCollapsed} />
      <ContentManagerNavbar collapsed={sidebarCollapsed} />
      <ContentManagerFooter collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} bg-gray-50 min-h-screen`}>
        <Container fluid className="py-4">
          <div className="d-flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                <Link component={ReactRouterLink} to="/content-manager/home" color="inherit" underline="hover">
                  Home
                </Link>{' '}
                /{' '}
                <Link component={ReactRouterLink} to="/content-manager/lesson" color="inherit" underline="hover">
                  Bài học
                </Link>{' '}
                / <span>Thêm</span>
              </Typography>
              <h4 className="mb-0">Thêm Bài học</h4>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={() => navigate('/content-manager/lesson')}>
                Hủy
              </Button>
              <Button variant="primary" disabled={!canSave || isSaving} onClick={handleSave}>
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>

          {/* === SECTION CHỌN FILTER === */}
          <Card elevation={2} className="mb-4 p-4 position-relative" style={{ paddingTop: 48 }}>
            <Button
              variant="outline-secondary"
              size="sm"
              className="position-absolute top-0 end-0 m-3 px-3 py-1"
              onClick={() => {
                setFilterGrade('all');
                setFilterSubject('all');
                setSelectedChapter('all');
                setActiveStep(0);
                setChapters([]);
                localStorage.removeItem('selectedGradeLesson');
                localStorage.removeItem('selectedSubjectLesson');
                localStorage.removeItem('selectedChapterLesson');
              }}
              style={{ zIndex: 10 }}
            >
              Đặt lại
            </Button>

            <div className="d-flex flex-wrap gap-3 align-items-center">
              {/* Grade */}
              <div className="d-flex align-items-center gap-2">
                <FaGraduationCap className="text-blue-600" size={16} />
                <Form.Select
                  size="sm"
                  value={filterGrade}
                  onChange={(e) => {
                    setFilterGrade(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 0 | 1 | 2));
                    setFilterSubject('all');
                    setSelectedChapter('all');
                    setActiveStep(1);
                  }}
                  style={{ minWidth: 120 }}
                  disabled={activeStep > 0}
                >
                  <option value="all">Chọn khối lớp</option>
                  {Object.entries(gradeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Form.Select>
                {filterGrade !== 'all' && <FaCheckCircle className="text-green-600" size={16} />}
              </div>

              {filterGrade !== 'all' && <span className="text-gray-400">→</span>}

              {/* Subject */}
              <div className="d-flex align-items-center gap-2">
                <FaBook className="text-green-600" size={16} />
                <Form.Select
                  size="sm"
                  value={filterSubject}
                  onChange={(e) => {
                    setFilterSubject(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 0 | 1));
                    setSelectedChapter('all');
                    setActiveStep(2);
                    setSelectedSimulation('');
                  }}
                  style={{ minWidth: 120 }}
                  disabled={filterGrade === 'all' || activeStep !== 1}
                >
                  <option value="all">Chọn môn học</option>
                  {Object.entries(subjectLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Form.Select>
                {filterSubject !== 'all' && <FaCheckCircle className="text-green-600" size={16} />}
              </div>

              {filterGrade !== 'all' && filterSubject !== 'all' && <span className="text-gray-400">→</span>}

              {/* Chapter */}
              <div className="d-flex align-items-center gap-2">
                <FaListUl className="text-purple-600" size={16} />
                <Form.Select
                  size="sm"
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  }}
                  style={{ minWidth: 180 }}
                  disabled={filterGrade === 'all' || filterSubject === 'all' || chapters.length === 0}
                >
                  <option value="all">{isLoadingChapters ? 'Đang tải...' : 'Chọn chương'}</option>
                  {chapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                      {chap.chapter_name}
                    </option>
                  ))}
                </Form.Select>
                {selectedChapter !== 'all' && <FaCheckCircle className="text-green-600" size={16} />}
              </div>
            </div>
          </Card>

          {/* === FORM THÔNG TIN BÀI HỌC === */}
          <Card elevation={2} className="p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  Tên bài học <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  name="name"
                  value={form.name}
                  maxLength={255}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  onBlur={validate}
                  isInvalid={!!errors.name}
                  required
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  name="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nội dung</Form.Label>
                <Form.Control
                  as="textarea"
                  name="content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Thứ tự bài học</Form.Label>
                <Form.Control
                  type="number"
                  name="lesson_number"
                  value={form.lesson_number}
                  onChange={(e) => setForm({ ...form, lesson_number: Number(e.target.value) })}
                  min={1}
                  required
                />
              </Form.Group>

              {/* Physics simulation dropdown: only when subject = 1 */}
              {filterSubject === 1 && (
                <Form.Group className="mb-3">
                  <Form.Label>Mô phỏng Vật lý</Form.Label>
                  <Select
                    labelId="simulation-label"
                    value={selectedSimulation}
                    onChange={(e: SelectChangeEvent) => setSelectedSimulation(e.target.value)}
                    fullWidth
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Chọn mô phỏng…</em>
                    </MenuItem>
                    {simulations.map((sim) => (
                      <MenuItem key={sim.id} value={sim.id}>
                        {sim.icon} {sim.title}
                      </MenuItem>
                    ))}
                  </Select>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>File bài giảng (PowerPoint / PDF)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".ppt,.pptx,.pdf"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
                    setFile(f);
                  }}
                />
                {file && <div className="mt-2 small">Đã chọn: <strong>{file.name}</strong></div>}
              </Form.Group>

              {/* UNITY SIMULATION (chỉ hiện với môn Toán) */}
              {filterSubject === 0 && (
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <Form.Label className="mb-0">Mô phỏng Toán hình</Form.Label>
                    <div className="d-flex gap-2">
                      {simulationSaved && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-inline-flex align-items-center gap-2"
                          onClick={clearSimulationData}
                          title="Xóa dữ liệu mô phỏng"
                        >
                          Xóa dữ liệu
                        </Button>
                      )}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="d-inline-flex align-items-center gap-2"
                        onClick={handleUnityReload}
                        title="Tải lại mô phỏng"
                      >
                        <FaSyncAlt />
                        Tải lại mô phỏng
                      </Button>
                    </div>
                  </div>

                  {/* {simulationSaved && simulationData && (
                    <div className="alert alert-success mt-2 mb-2" role="alert">
                      <strong>✅ Dữ liệu mô phỏng đã lưu (JSON):</strong>
                      <ul className="mb-0 mt-1">
                        <li>Kích thước: <strong>{simulationData.length}</strong> ký tự</li>
                        <li>Xem nhanh: <code>{simulationData.slice(0, 120)}{simulationData.length > 120 ? '…' : ''}</code></li>
                      </ul>
                    </div>
                  )} */}

                  <div
                    className="ratio ratio-16x9 mt-2"
                    style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}
                  >
                    <iframe
                      key={unityKey}
                      src={unitySrc}
                      title="Unity WebGL"
                      style={{ width: '100%', height: 600, border: 0 }}
                      allow="fullscreen"
                    />
                  </div>
                </div>
              )}
            </Form>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="outline-secondary" onClick={() => navigate('/content-manager/lesson')}>Hủy</Button>
              <Button variant="primary" disabled={!canSave || isSaving} onClick={handleSave}>
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </Card>
        </Container>
      </main>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: { xs: 70, sm: 70 } }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddLesson;
