import React, { useState, useEffect } from 'react';
import { Container, Button, Form } from 'react-bootstrap';
import ContentManagerSidebar from '../../components/layout/ContentManagerSidebar';
import ContentManagerNavbar from '../../components/layout/ContentManagerNavbar';
import ContentManagerFooter from '../../components/layout/ContentManagerFooter';
import chapterService from '../../services/chapterService';
import lessonService from '../../services/lessonService';
import { useLocation, Link as ReactRouterLink, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { FaPlus, FaEye } from 'react-icons/fa';
import { Card } from '@mui/material';
import { FaGraduationCap, FaBook, FaListUl, FaCheckCircle } from 'react-icons/fa';
import Modal from 'react-bootstrap/Modal';
import TableSortLabel from '@mui/material/TableSortLabel';

interface Lesson {
  id: number;
  name: string;
  chapter_id: number;
  description?: string | null;
  content?: string | null;
  lesson_number?: number;
  subject?: number;
  grade?: number;

  slide_count?: number;
  slides_ready?: boolean;
  slide_object_names?: string[];
  slide_urls?: string[];
}

const LessonsList: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [chapters, setChapters] = useState<{ id: number; chapter_name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [filterGrade, setFilterGrade] = useState<'all' | 0 | 1 | 2>('all');
  const [filterSubject, setFilterSubject] = useState<0 | 1>(0);
  const [selectedChapter, setSelectedChapter] = useState<number | 'all'>('all');
  const [, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const location = useLocation();
  const navigate = useNavigate();
  const gradeLabels: Record<number, string> = { 0: 'Lớp 10', 1: 'Lớp 11', 2: 'Lớp 12' };
  const subjectLabels: Record<number, string> = { 0: 'Toán học', 1: 'Vật lý' };
  const [activeStep, setActiveStep] = useState(0);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    content: '',
    lesson_number: 1,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sorting
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<'index' | 'name'>('index');

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLesson, setDetailLesson] = useState<Lesson | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [isEditLoading, setIsEditLoading] = useState(false);

  // Edit file selection (multiple)
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);

  // Slides preview (reuses detailLesson's slide_urls for view)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const savedGrade = localStorage.getItem('selectedGradeLesson');
    const savedSubject = localStorage.getItem('selectedSubjectLesson');
    const savedChapter = localStorage.getItem('selectedChapterLesson');
    if (savedGrade !== null && savedSubject !== null) {
      setFilterGrade(Number(savedGrade) as 0 | 1 | 2);
      setFilterSubject(Number(savedSubject) as 0 | 1);
      setActiveStep(2);
      if (savedChapter !== null) setSelectedChapter(Number(savedChapter));
    }
  }, []);

  // Load subject from localStorage once and mirror to selectedSubjectLesson
  useEffect(() => {
    const s = Number(localStorage.getItem('subject') ?? '0') as 0 | 1;
    setFilterSubject(s);
    localStorage.setItem('selectedSubjectLesson', String(s));
  }, []);
  // Save to localStorage on change
  useEffect(() => {
    if (filterGrade !== 'all') localStorage.setItem('selectedGradeLesson', String(filterGrade));
  }, [filterGrade]);

  useEffect(() => {
    if (selectedChapter !== 'all') localStorage.setItem('selectedChapterLesson', String(selectedChapter));
  }, [selectedChapter]);

  useEffect(() => {
    localStorage.setItem('selectedSubjectLesson', String(localStorage.getItem('subject') ?? '0'));
    if (selectedChapter !== 'all') {
      fetchLessons(selectedChapter as number);
    } else {
      setLessons([]);
      setTotal(0);
    }
  }, [selectedChapter, page, rowsPerPage, order, orderBy]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  useEffect(() => {
    if (filterGrade !== 'all') {
      fetchChapters();
    } else {
      setChapters([]);
      setSelectedChapter('all');
      setLessons([]);
    }
  }, [filterGrade, filterSubject]);


  const fetchChapters = async () => {
    setIsLoading(true);
    try {
      const { list } = await chapterService.getChapters({
        page: 0,
        size: 1000,
        grade: filterGrade === 'all' ? undefined : filterGrade,
        subject: filterSubject,
      });
      setChapters(list || []);

      // Set the selected chapter to the first chapter if available
      if (list && list.length > 0) {
        setSelectedChapter(list[0].id);
      } else {
        setSelectedChapter('all');
      }
    } catch {
      setChapters([]);
      setSelectedChapter('all');
      setSnackbarMessage('Không thể tải danh sách chương!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchLessons = async (chapterId: number) => {
    if (filterGrade === 'all') return;
    setIsLoading(true);
    try {
      const data = await lessonService.getLessons({
        subject: filterSubject,
        grade: filterGrade,
        chapter_id: chapterId,
        page: page,
        size: rowsPerPage === 10000 ? 10000 : rowsPerPage,
        sort: orderBy === 'name' ? `name,${order}` : `id,${order}`,
      });
      setLessons(data.list || []);
      setTotal(data.total || 0);
    } catch {
      setLessons([]);
      setTotal(0);
      setSnackbarMessage('Không thể tải danh sách bài học!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (value === -1) {
      setRowsPerPage(10000);
    } else {
      setRowsPerPage(value);
    }
    setPage(0);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = lessons.map((n: Lesson) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  const filteredLessons = lessons.filter(lesson =>
    (lesson.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestSort = (property: 'index' | 'name') => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleShowEditModal = async (lesson: Lesson) => {
    setIsEditLoading(true);
    setEditSelectedFiles([]);
    try {
      const data = await lessonService.getLessonById(lesson.id);
      setEditLesson(data);
      setEditForm({
        name: data.name || '',
        description: data.description || '',
        content: data.content || '',
        lesson_number: data.lesson_number || 1,
      });
      setShowEditModal(true);
    } catch {
      setSnackbarMessage('Không thể tải dữ liệu bài học để chỉnh sửa!');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditLesson(null);
    setEditSelectedFiles([]);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditFormNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, lesson_number: Number(e.target.value) });
  };

  type UpdateLessonPayload = {
    id: string;
    name: string;
    description: string;
    content: string;
    lesson_number: number;
  };

  const handleSaveEdit = async () => {
    if (!editLesson) return;
    setIsSaving(true);
    try {
      const payload: UpdateLessonPayload = {
        id: String(editLesson.id),
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        content: editForm.content.trim(),
        lesson_number: editForm.lesson_number,
      };

      await lessonService.updateLesson(
        editLesson.id,
        payload,
        editSelectedFiles.length > 0 ? editSelectedFiles[0] : null
      );

      setSnackbarMessage('Cập nhật bài học thành công!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setShowEditModal(false);
      setEditSelectedFiles([]);

      fetchLessons(editLesson.chapter_id);
    } catch (error: unknown) {
      type ErrorResponse = { response?: { data?: { messages?: string[]; message?: string } } };
      const err = error as ErrorResponse;
      const beMsg = Array.isArray(err.response?.data?.messages)
        ? err.response?.data?.messages?.join(' ')
        : undefined;
      setSnackbarMessage(
        beMsg || err.response?.data?.message || 'Cập nhật bài học thất bại!'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowDetailModal = async (lessonId: number) => {
    setIsDetailLoading(true);
    setShowDetailModal(true);
    try {
      const data = await lessonService.getLessonById(lessonId);
      setDetailLesson(data);
    } catch {
      setDetailLesson(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailLesson(null);
  };

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!detailLesson?.slide_urls?.length) return;
      if (e.key === 'ArrowLeft') {
        setPreviewIndex(i => (i - 1 + detailLesson.slide_urls!.length) % detailLesson.slide_urls!.length);
      } else if (e.key === 'ArrowRight') {
        setPreviewIndex(i => (i + 1) % detailLesson.slide_urls!.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewOpen, detailLesson?.slide_urls]);

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
                <Link component={ReactRouterLink} to="/content-manager/dashboard" color="inherit" underline="hover">Tổng quan</Link> / <Link component={ReactRouterLink} to={location.pathname} color="inherit" underline="hover">Bài học</Link>
              </Typography>
              <h4 className="mb-0">Quản lý Bài học</h4>
            </div>
            <Button variant="primary" className="flex items-center gap-2" onClick={() => navigate('/content-manager/lesson/add')}>
              <FaPlus className="me-2" /> Thêm Bài học
            </Button>
          </div>
          <Card elevation={2} className="mb-4 p-4 position-relative" style={{ paddingTop: 48 }}>
            <Button
              variant="outline-secondary"
              size="sm"
              className="position-absolute top-0 end-0 m-3 px-3 py-1"
              onClick={() => {
                setFilterGrade('all');
                // 🔒 Do not reset subject; it’s fixed from localStorage
                setSelectedChapter('all');
                setActiveStep(0);
                setLessons([]);
                setChapters([]);
                localStorage.removeItem('selectedGradeLesson');
                localStorage.removeItem('selectedChapterLesson');
              }}
              style={{ zIndex: 10 }}
            >
              Đặt lại
            </Button>

            <div className="d-flex flex-wrap gap-3 align-items-center">
              {/* SUBJECT: disabled, value comes from state initialized from localStorage */}
              <div className="d-flex align-items-center gap-2">
                <FaBook className="text-green-600" size={16} />
                <Form.Select
                  size="sm"
                  value={filterSubject}
                  onChange={() => { /* no-op, disabled */ }}
                  style={{ minWidth: 120 }}
                  disabled
                >
                  {Object.entries(subjectLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Form.Select>
                <FaCheckCircle className="text-green-600" size={16} />
              </div>

              <span className="text-gray-400">→</span>

              {/* GRADE */}
              <div className="d-flex align-items-center gap-2">
                <FaGraduationCap className="text-blue-600" size={16} />
                <Form.Select
                  size="sm"
                  value={filterGrade}
                  onChange={e => {
                    const v = e.target.value;
                    setFilterGrade(v === 'all' ? 'all' : (Number(v) as 0 | 1 | 2));
                    setSelectedChapter('all');
                    setActiveStep(1);
                  }}
                  style={{ minWidth: 120 }}
                  disabled={activeStep > 0}
                >
                  <option value="all">Chọn khối lớp</option>
                  {Object.entries(gradeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Form.Select>
                {filterGrade !== 'all' && <FaCheckCircle className="text-green-600" size={16} />}
              </div>

              {filterGrade !== 'all' && <span className="text-gray-400">→</span>}

              {/* CHAPTER */}
              <div className="d-flex align-items-center gap-2">
                <FaListUl className="text-purple-600" size={16} />
                <Form.Select
                  size="sm"
                  value={selectedChapter}
                  onChange={e => {
                    const v = e.target.value;
                    setSelectedChapter(v === 'all' ? 'all' : Number(v));
                  }}
                  style={{ minWidth: 180 }}
                  // ⛔️ No longer checks filterSubject === 'all'
                  disabled={filterGrade === 'all' || chapters.length === 0}
                >
                  <option value="all">Chọn chương</option>
                  {chapters.map(chap => (
                    <option key={chap.id} value={chap.id}>{chap.chapter_name}</option>
                  ))}
                </Form.Select>
                {selectedChapter !== 'all' && <FaCheckCircle className="text-green-600" size={16} />}
              </div>
            </div>
          </Card>

          <Form.Control
            type="text"
            placeholder="Tìm kiếm bài học..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); }}
            style={{ maxWidth: 250 }}
          />

          <TableContainer component={Paper} className="mb-4">
            <Table size="small" aria-label="Danh sách bài học">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: 48 }}>
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < filteredLessons.length}
                      checked={filteredLessons.length > 0 && selected.length === filteredLessons.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all lessons' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'index'}
                      direction={orderBy === 'index' ? order : 'asc'}
                      onClick={() => handleRequestSort('index')}
                    >
                      #
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                    >
                      Tên bài học
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Chương</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'left', minWidth: 120 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLessons.map((lesson, idx) => {
                  const isItemSelected = isSelected(lesson.id);
                  return (
                    <TableRow
                      key={lesson.id}
                      hover
                      selected={isItemSelected}
                      sx={isItemSelected ? { backgroundColor: '#e3f2fd' } : {}}
                    >
                      <TableCell>
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => {
                            const selectedIndex = selected.indexOf(lesson.id);
                            let newSelected: readonly number[] = [];
                            if (selectedIndex === -1) {
                              newSelected = [...selected, lesson.id];
                            } else {
                              newSelected = selected.filter(id => id !== lesson.id);
                            }
                            setSelected(newSelected);
                          }}
                          inputProps={{ 'aria-labelledby': `lesson-checkbox-${lesson.id}` }}
                        />
                      </TableCell>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{lesson.name}</TableCell>
                      <TableCell>{chapters.find(c => c.id === lesson.chapter_id)?.chapter_name || '-'}</TableCell>

                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleShowDetailModal(lesson.id)}
                            style={{ minWidth: 32, minHeight: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <FaEye fontSize="small" />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowEditModal(lesson)}
                            style={{ minWidth: 32, minHeight: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <EditIcon fontSize="small" />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled
                            style={{ minWidth: 32, minHeight: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLessons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Không có bài học nào</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 20, { label: 'Tất cả', value: -1 }]}
              component="div"
              count={searchTerm ? filteredLessons.length : total}
              rowsPerPage={rowsPerPage === 10000 ? -1 : rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số hàng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                '.MuiTablePagination-toolbar': {
                  justifyContent: 'space-between',
                  paddingLeft: 0,
                  flexWrap: 'wrap',
                },
                '.MuiTablePagination-spacer': {
                  flexGrow: 1,
                  order: 2,
                },
                '.MuiTablePagination-actions': {
                  order: 1,
                  marginRight: '20px',
                },
                '.MuiTablePagination-selectLabel': {
                  order: 3,
                },
                '.MuiInputBase-root.MuiTablePagination-select': {
                  order: 4,
                },
                '.MuiTablePagination-displayedRows': {
                  order: 5,
                  marginLeft: 'auto',
                },
              }}
            />
          </TableContainer>
        </Container>
      </main>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: { xs: 70, sm: 70 } }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* EDIT MODAL */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa Bài học</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {isEditLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên bài học</Form.Label>
                <Form.Control
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={2}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nội dung</Form.Label>
                <Form.Control
                  as="textarea"
                  name="content"
                  value={editForm.content}
                  onChange={handleEditFormChange}
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Thứ tự bài học</Form.Label>
                <Form.Control
                  type="number"
                  name="lesson_number"
                  value={editForm.lesson_number}
                  onChange={handleEditFormNumberChange}
                  min={1}
                  required
                />
              </Form.Group>

              {/* FILE STATUS based on get-by-id */}
              {editLesson && (
                <div className="mb-3">
                  {(() => {
                    const hasSlides =
                      !!editLesson.slide_count ||
                      (Array.isArray(editLesson.slide_urls) && editLesson.slide_urls.length > 0) ||
                      (Array.isArray(editLesson.slide_object_names) && editLesson.slide_object_names.length > 0);

                    const slideCount =
                      editLesson.slide_count ??
                      editLesson.slide_urls?.length ??
                      editLesson.slide_object_names?.length ??
                      0;

                    return (
                      <div className="d-flex align-items-center gap-2">
                        {hasSlides ? (
                          <>
                            <span className="badge bg-success">Đã có file</span>
                            <span className="text-muted small">
                              {editLesson.slides_ready ? `Đã render ${slideCount} slide` : 'Đang render slide…'}
                            </span>
                            {/* <Button
                              variant="outline-secondary"
                              size="sm"
                              className="ms-auto"
                              onClick={() => {
                                setPreviewIndex(0);
                                setPreviewOpen(true);
                              }}
                              disabled={!editLesson.slides_ready || !(editLesson.slide_urls?.length)}
                            >
                              Xem slides
                            </Button> */}
                          </>
                        ) : (
                          <span className="text-muted small">Chưa có file đính kèm</span>
                        )}
                      </div>
                    );
                  })()}

                  {Array.isArray(editLesson.slide_object_names) && editLesson.slide_object_names.length > 0 && (
                    <div className="small text-muted mt-1">
                      Thư mục: <code>{editLesson.slide_object_names[0].split('/').slice(0, -1).join('/')}</code>
                    </div>
                  )}
                </div>
              )}

              {/* SELECT MULTIPLE FILES FOR UPDATE */}
              <Form.Group className="mb-3">
                <Form.Label>File bài giảng (PowerPoint / PDF)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".ppt,.pptx,.pdf"
                  multiple
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const list = e.target.files ? Array.from(e.target.files) : [];
                    setEditSelectedFiles(list);
                  }}
                  disabled={isSaving}
                />
                <Form.Text className="text-muted">
                  Chọn 1 hoặc nhiều file để thay thế/bổ sung. Để trống để giữ nguyên file hiện tại.
                </Form.Text>

                {editSelectedFiles.length > 0 && (
                  <div className="mt-2 small">
                    <div className="fw-semibold">Sẽ upload:</div>
                    <ul className="mb-2">
                      {editSelectedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                    </ul>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setEditSelectedFiles([])}
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>Hủy</Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            disabled={isSaving || isEditLoading}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal show={showDetailModal} onHide={handleCloseDetailModal} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-0 pb-4">
          <Modal.Title className="d-flex align-items-center text-dark">
            <i className="fas fa-book-open text-primary me-3"></i>
            <span className="fw-bold fs-4">Chi tiết Bài học</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4 bg-light">
          {isDetailLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mb-0">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : detailLesson ? (
            <div className="space-y-4">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body bg-white rounded">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="fas fa-graduation-cap text-primary"></i>
                        </div>
                        <div>
                          <label className="form-label fw-semibold text-muted small mb-1">Tên bài học</label>
                          <div className="fw-bold text-dark">{detailLesson.name}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="fas fa-list-ol text-success"></i>
                        </div>
                        <div>
                          <label className="form-label fw-semibold text-muted small mb-1">Thứ tự</label>
                          <div className="badge bg-success rounded-pill fs-6">{detailLesson.lesson_number}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex align-items-start">
                        <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="fas fa-folder text-warning"></i>
                        </div>
                        <div>
                          <label className="form-label fw-semibold text-muted small mb-1">Chương</label>
                          <div className="text-dark">{chapters.find(c => c.id === detailLesson.chapter_id)?.chapter_name || '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex align-items-start">
                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="fas fa-users text-info"></i>
                        </div>
                        <div>
                          <label className="form-label fw-semibold text-muted small mb-1">Khối lớp</label>
                          <div className="text-dark">{typeof detailLesson.grade !== 'undefined' ? gradeLabels[detailLesson.grade] : '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex align-items-start">
                        <div className="bg-purple bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0" style={{ backgroundColor: 'rgba(139, 69, 193, 0.1)' }}>
                          <i className="fas fa-book text-purple" style={{ color: '#8b45c1' }}></i>
                        </div>
                        <div>
                          <label className="form-label fw-semibold text-muted small mb-1">Môn học</label>
                          <div className="text-dark">{typeof detailLesson.subject !== 'undefined' ? subjectLabels[detailLesson.subject] : '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slides Card */}
              <div className="card border-0 shadow-sm mt-3">
                <div className="card-header bg-white border-bottom py-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="fas fa-images text-info"></i>
                    </div>
                    <h6 className="mb-0 fw-semibold">
                      Slide bài giảng {typeof detailLesson?.slide_count === 'number' ? `(${detailLesson.slide_count})` : ''}
                    </h6>
                    {detailLesson?.slides_ready === false && (
                      <span className="badge bg-warning text-dark ms-2">Đang xử lý…</span>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  {detailLesson?.slides_ready && Array.isArray(detailLesson?.slide_urls) && detailLesson.slide_urls.length > 0 ? (
                    <>
                      <div className="row g-2">
                        {detailLesson.slide_urls.map((url, i) => (
                          <div className="col-6 col-md-4 col-lg-3" key={i}>
                            <div
                              className="border rounded position-relative overflow-hidden"
                              role="button"
                              onClick={() => { setPreviewIndex(i); setPreviewOpen(true); }}
                              title={`Slide ${i + 1}`}
                            >
                              <img
                                src={url}
                                alt={`Slide ${i + 1}`}
                                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                                loading="lazy"
                              />
                              <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-1">{i + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-muted small mt-2">
                        URL slide là link ký số và có hạn. Nếu hết hạn, mở lại chi tiết bài học để làm mới.
                      </div>
                    </>
                  ) : (
                    <em className="text-muted">
                      {detailLesson?.slides_ready === false
                        ? 'Slide đang được render. Vui lòng quay lại sau.'
                        : 'Chưa có slide để hiển thị.'}
                    </em>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>Không thể tải chi tiết bài học.</div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-white border-top-0 pt-3">
          <Button
            variant="outline-secondary"
            onClick={handleCloseDetailModal}
            className="px-4 py-2 d-flex align-items-center"
          >
            <i className="fas fa-times me-2"></i>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal show={previewOpen} onHide={() => setPreviewOpen(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Slide {previewIndex + 1} / {detailLesson?.slide_urls?.length ?? 0}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark d-flex justify-content-center">
          {detailLesson?.slide_urls?.[previewIndex] ? (
            <img
              src={detailLesson.slide_urls[previewIndex]}
              alt={`Slide ${previewIndex + 1}`}
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          ) : null}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="outline-secondary"
            onClick={() => setPreviewIndex((i) =>
              detailLesson?.slide_urls ? (i - 1 + detailLesson.slide_urls.length) % detailLesson.slide_urls.length : 0
            )}
            disabled={!detailLesson?.slide_urls?.length}
          >
            ← Trước
          </Button>
          <div className="flex-grow-1 text-center small text-muted">
            Nhấn ← / → (bàn phím) để điều hướng
          </div>
          <Button
            variant="outline-secondary"
            onClick={() => setPreviewIndex((i) =>
              detailLesson?.slide_urls ? (i + 1) % detailLesson.slide_urls.length : 0
            )}
            disabled={!detailLesson?.slide_urls?.length}
          >
            Sau →
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LessonsList;
