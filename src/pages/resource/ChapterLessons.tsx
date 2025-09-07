import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Spinner,
  Alert,
} from 'react-bootstrap';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  LibraryBooks as LibraryBooksIcon,
} from '@mui/icons-material';
import NavigationBar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { listMenuUser } from '../../config';
import lessonService from '../../services/lessonService';
import chapterService from '../../services/chapterService';
import { subjectConfig } from '../../config/subjects';
import { Modal } from 'react-bootstrap';
import {  UNITY_URL, UNITY_PHY_URL } from '../../api/apiConfig';

interface LessonLocationState {
  subject: 0 | 1;
  grade: number;
}

const ChapterLessons = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LessonLocationState;
  const { subject } = state || {};

  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonDetail, setLessonDetail] = useState<any | null>(null);
  const [chapterDetails, setChapterDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Unity (Math host)
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadToken, _setReloadToken] = useState<string>(() => Date.now().toString());
  const [selectedSimulation, _setSelectedSimulation] = useState<string | null>(null);
  const toolName = selectedLesson?.name ?? 'simulation';

  // Zoom slide
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIdx, setZoomIdx] = useState(0);

  useEffect(() => {
    const fetchChapterAndLessons = async () => {
      if (!chapterId) return;
      try {
        setLoading(true);
        setError(null);

        const numericChapterId = parseInt(chapterId, 10);
        if (isNaN(numericChapterId)) {
          setError('Chapter ID không hợp lệ.');
          setLoading(false);
          return;
        }

        const chapterRes = await chapterService.getChapterById(numericChapterId);
        setChapterDetails(chapterRes);

        if (chapterRes) {
          const lessonsRes = await lessonService.getLessons({
            subject: chapterRes.subject,
            grade: chapterRes.grade,
            chapter_id: numericChapterId,
            size: 100,
          });

          const list = lessonsRes.list ?? [];
          setLessons(list);

          if (list.length > 0) {
            setSelectedLesson(list[0]); // set tạm để highlight
          } else {
            setLessonDetail(null);
          }
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterAndLessons();
  }, [chapterId]);

  // khi selectedLesson đổi -> gọi API lấy chi tiết (slide_urls, description, ...)
  useEffect(() => {
    const fetchLessonDetail = async () => {
      if (!selectedLesson?.id) {
        setLessonDetail(null);
        return;
      }
      try {
        setDetailLoading(true);
        const detail = await lessonService.getLessonById(selectedLesson.id);
        setLessonDetail(detail);
        setSlideIdx(0); // luôn đứng ở slide đầu
      } catch (e) {
        console.error(e);
        setLessonDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchLessonDetail();
  }, [selectedLesson?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lessonDetail?.slide_urls?.length) return;
      if (e.key === 'ArrowLeft') {
        setSlideIdx((i) => (i - 1 + lessonDetail.slide_urls.length) % lessonDetail.slide_urls.length);
      } else if (e.key === 'ArrowRight') {
        setSlideIdx((i) => (i + 1) % lessonDetail.slide_urls.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lessonDetail?.slide_urls]);

  // ---- Tool cho subject = 1 ----
  // Ưu tiên simulation_key từ API; fallback theo tên bài (nếu bạn có hàm pickToolByLessonName ở nơi khác)
  const subject1ToolByName =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (typeof (window as any).pickToolByLessonName === 'function'
      ? (window as any).pickToolByLessonName(lessonDetail?.name ?? selectedLesson?.name ?? null)
      : undefined);

  const physicsTool: string | null = useMemo(() => {
    // Ưu tiên khóa do backend trả về
    if (lessonDetail?.simulation_key) return lessonDetail.simulation_key as string;
    // Fallback theo logic cũ (suy từ tên bài)
    if (subject1ToolByName) return subject1ToolByName as string;
    return null;
  }, [lessonDetail?.simulation_key, subject1ToolByName]);

  // ---- Chuẩn hóa sim payload (Math) ----
  function normalizeSimData(raw: unknown) {
    if (raw == null) return null;
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return null;
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    }
    return raw;
  }
  const simPayload = useMemo(
    () => normalizeSimData(lessonDetail?.simulation_data),
    [lessonDetail?.simulation_data]
  );

  const simPayloadRef = useRef<unknown>(null);
  useEffect(() => {
    simPayloadRef.current = simPayload;
  }, [simPayload]);

  // Ready flags (Math host)
  const [iframeReady, setIframeReady] = useState(false);
  const [unityReady, setUnityReady] = useState(false);
  const [isSimLoading, setIsSimLoading] = useState(false);

  const UNITY_ORIGIN = useMemo(() => {
    try { return new URL(UNITY_URL).origin; } catch { return '*'; }
  }, [UNITY_URL]);
  
  // onLoad chỉ đánh dấu iframe, KHÔNG tắt loading quá sớm
  const onIframeLoad = () => {
    setIframeReady(true);
    // Đợi UNITY_INSTANCE_READY mới setIsSimLoading(false)
  };
  
  // Gửi 1 lần
  function sendSimulationOnce(data: unknown) {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
  
    if (!iframeReady || !unityReady) {
      console.warn('[React] Skip send:', { unityReady, iframeReady });
      return;
    }
    win.postMessage(data, UNITY_ORIGIN);
    console.log('[React] Sent SIMULATION_DATA ->', UNITY_ORIGIN, data);
  }
  
  // Lắng nghe từ WebGL (Math host)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      // Chấp nhận nếu:
      // - Cùng window nguồn (iframe hiện tại), và
      // - Origin khớp, hoặc là "null" (trường hợp sandbox nhưng bạn chủ động cho phép)
      const fromIframe = e.source === iframeRef.current?.contentWindow;
      const goodOrigin = e.origin === UNITY_ORIGIN || e.origin === 'null';
  
      if (!fromIframe || !goodOrigin) {
        // Log để soi mismatch
        // console.log('[React] Ignore message from', e.origin, { fromIframe, goodOrigin });
        return;
      }
  
      const t = e.data?.type;
  
      if (t === 'UNITY_LISTENER_READY') {
        console.log('[React] got UNITY_LISTENER_READY');
        if (simPayloadRef.current != null) {
          // Cho phép gửi sớm ngay khi listener đã sẵn sàng
          iframeRef.current?.contentWindow?.postMessage(simPayloadRef.current, UNITY_ORIGIN);
        }
        return;
      }
  
      if (t === 'UNITY_INSTANCE_READY') {
        console.log('[React] got UNITY_INSTANCE_READY');
        setUnityReady(true);
        setIsSimLoading(false);
  
        if (simPayloadRef.current != null) {
          // Gửi ngay + retry nhẹ để chắc Unity/C# nhận
          const win = iframeRef.current?.contentWindow;
          win?.postMessage(simPayloadRef.current, UNITY_ORIGIN);
          let tries = 0;
          const id = setInterval(() => {
            tries++;
            if (tries > 3) return clearInterval(id);
            win?.postMessage(simPayloadRef.current, UNITY_ORIGIN);
          }, 800);
        }
        return;
      }
  
      if (t === 'SIMULATION_ACK') {
        console.log('[React] WebGL ACK: data has been forwarded to C#.');
        return;
      }
  
      if (t === 'PONG') {
        // Nếu bạn có cơ chế PING/PONG
        setUnityReady(true);
        setIsSimLoading(false);
        return;
      }
    };
  
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [UNITY_ORIGIN, iframeReady]);
  
  // Khi payload đổi và 2 phía đã ready thì gửi
  useEffect(() => {
    if (!unityReady || !iframeReady) return;
    if (simPayload == null) return;
    sendSimulationOnce(simPayload);
  }, [unityReady, iframeReady, simPayload]);
  
  // Tuỳ chọn: chủ động "đánh thức" Unity nếu sau 3–5s vẫn chưa thấy READY
  useEffect(() => {
    if (!iframeReady || unityReady) return;
    const win = iframeRef.current?.contentWindow;
    const id = setInterval(() => {
      win?.postMessage({ type: 'PING' }, UNITY_ORIGIN);
    }, 1000);
    const timeout = setTimeout(() => clearInterval(id), 5000);
    return () => { clearInterval(id); clearTimeout(timeout); };
  }, [iframeReady, unityReady, UNITY_ORIGIN]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <NavigationBar listMenuUser={listMenuUser} />
      <Container fluid className="flex-grow-1 my-4" style={{ maxWidth: '1400px' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <Typography className="mt-2">Đang tải bài học...</Typography>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <>
            {/* Breadcrumbs and Title */}
            <Box mb={4}>
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
              >
                <MuiLink
                  underline="hover"
                  color="inherit"
                  href="#"
                  onClick={() => navigate('/')}
                  className="d-flex align-items-center"
                >
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Trang chủ
                </MuiLink>
                <MuiLink
                  underline="hover"
                  color="inherit"
                  href="#"
                  onClick={() =>
                    navigate(
                      subject !== undefined && (subject === 0 || subject === 1)
                        ? subjectConfig[subject].path
                        : '/'
                    )
                  }
                  className="d-flex align-items-center"
                >
                  <LibraryBooksIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  {subject !== undefined && (subject === 0 || subject === 1)
                    ? subjectConfig[subject].title
                    : 'Môn học'}
                </MuiLink>
                <Typography color="text.primary" className="d-flex align-items-center">
                  {chapterDetails?.chapter_name}
                </Typography>
              </Breadcrumbs>
              <Typography variant="h4" className="fw-bold mt-2">
                {chapterDetails?.chapter_name}
              </Typography>
            </Box>

            <Row className="g-4">
              {/* Left: Lessons List */}
              <Col md={4} xl={3}>
                <Card className="shadow-sm">
                  <Card.Header className="fw-bold">Danh sách bài học</Card.Header>
                  <ListGroup
                    variant="flush"
                    style={{ overflowY: 'auto', maxHeight: 'calc(75vh - 56px)' }}
                  >
                    {lessons.length > 0 ? (
                      lessons.map((lesson) => (
                        <ListGroup.Item
                          key={lesson.id}
                          action
                          active={selectedLesson?.id === lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={selectedLesson?.id === lesson.id ? 'lesson-item-active' : ''}
                          style={{ cursor: 'pointer' }}
                        >
                          {lesson.lesson_number}. {lesson.name}
                        </ListGroup.Item>
                      ))
                    ) : (
                      <ListGroup.Item>Hiện chưa có bài học.</ListGroup.Item>
                    )}
                  </ListGroup>
                </Card>
              </Col>

              {/* Right: Lesson Content */}
              <Col md={8} xl={9}>
                <Card className="shadow-sm">
                  <Card.Body style={{ minHeight: '80vh' }}>
                    {!selectedLesson ? (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <Typography color="text.secondary">
                          Chọn một bài học để xem nội dung
                        </Typography>
                      </div>
                    ) : detailLoading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <Typography className="mt-2">Đang tải nội dung bài học...</Typography>
                      </div>
                    ) : (
                      <div>
                        <Typography variant="h5" className="fw-bold mb-3">
                          {lessonDetail?.name ?? selectedLesson.name}
                        </Typography>

                        {Array.isArray(lessonDetail?.slide_urls) && lessonDetail.slide_urls.length > 0 ? (
                          <>
                            {/* vùng hiển thị 1 slide */}
                            <div
                              className="border rounded"
                              style={{ overflow: 'hidden', position: 'relative', cursor: 'zoom-in' }}
                              onClick={() => {
                                setZoomIdx(slideIdx);
                                setZoomOpen(true);
                              }}
                            >
                              <img
                                src={lessonDetail.slide_urls[slideIdx]}
                                alt={`Slide ${slideIdx + 1}`}
                                loading="lazy"
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                              />
                            </div>

                            {/* điều khiển Next / Back + vị trí */}
                            <div className="d-flex justify-content-between align-items-center mt-3">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                  const total = lessonDetail.slide_urls.length;
                                  setSlideIdx((prev) => (prev - 1 + total) % total);
                                }}
                              >
                                ← Trước
                              </button>

                              <Typography variant="body2" color="text.secondary">
                                {slideIdx + 1} / {lessonDetail.slide_urls.length}
                              </Typography>

                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                  const total = lessonDetail.slide_urls.length;
                                  setSlideIdx((prev) => (prev + 1) % total);
                                }}
                              >
                                Sau →
                              </button>
                            </div>

                            {/* mô tả nếu có */}
                            {lessonDetail?.description ? (
                              <Typography variant="body2" className="mt-3" sx={{ whiteSpace: 'pre-wrap' }}>
                                {lessonDetail.description}
                              </Typography>
                            ) : null}

                            {/* Modal phóng to */}
                            <Modal show={zoomOpen} onHide={() => setZoomOpen(false)} size="xl" centered>
                              <Modal.Body className="p-0">
                                <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                      const total = lessonDetail.slide_urls.length;
                                      setZoomIdx((prev) => (prev - 1 + total) % total);
                                    }}
                                  >
                                    ← Trước
                                  </button>

                                  <Typography variant="body2" color="text.secondary">
                                    {zoomIdx + 1} / {lessonDetail.slide_urls.length}
                                  </Typography>

                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                      const total = lessonDetail.slide_urls.length;
                                      setZoomIdx((prev) => (prev + 1) % total);
                                    }}
                                  >
                                    Sau →
                                  </button>
                                </div>

                                <div style={{ background: '#000', textAlign: 'center' }}>
                                  <img
                                    src={lessonDetail.slide_urls[zoomIdx]}
                                    alt={`Slide ${zoomIdx + 1}`}
                                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                                  />
                                </div>
                              </Modal.Body>
                            </Modal>
                          </>
                        ) : lessonDetail?.description ? (
                          // Không có slide -> hiện description
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {lessonDetail.description}
                          </Typography>
                        ) : (
                          // Không có slide và description
                          <Typography color="text.secondary">Nội dung đang được cập nhật.</Typography>
                        )}

                        {/* Unity WebGL iframe cho subject === 0 (Toán học) */}
                        {subject === 0 && (
                          <Box sx={{ mb: 0, mt: 1 }}>
                            <Typography variant="h6" className="mb-2">
                              Mô phỏng thí nghiệm
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: '520px',
                                overflow: 'hidden',
                                backgroundColor: '#f8f9fa',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <iframe
                                ref={iframeRef}
                                title="Unity WebGL Simulation (Math)"
                                src={`${UNITY_URL}?tool=${encodeURIComponent(
                                  selectedSimulation || toolName
                                )}&v=${reloadToken}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  border: 'none',
                                  display: 'block',
                                }}
                                onLoad={onIframeLoad}
                                allow="fullscreen; xr-spatial-tracking; clipboard-read; clipboard-write"
                                allowFullScreen
                              />
                            </Box>
                          </Box>
                        )}

                        {/* Unity WebGL iframe cho subject === 1 (Vật lý)
                            YÊU CẦU: Nếu simulation_key != null thì hiển thị tool Unity (ưu tiên simulation_key) */}
                        {subject === 1 && physicsTool && (
                          <Box sx={{ mb: 0, mt: 3 }}>
                            <Typography variant="h6" className="mb-2">
                              Mô phỏng thí nghiệm
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: '520px',
                                overflow: 'hidden',
                                backgroundColor: '#f8f9fa',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <iframe
                                title="Unity WebGL Simulation (Physics)"
                                src={`${UNITY_PHY_URL}?tool=${encodeURIComponent(physicsTool)}&v=${reloadToken}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  border: 'none',
                                  display: 'block',
                                }}
                                // có thể dùng onLoad nếu cần track ready, nhưng host vật lý có origin khác UNITY_HOST
                                allow="fullscreen; xr-spatial-tracking; clipboard-read; clipboard-write"
                                allowFullScreen
                              />
                            </Box>
                          </Box>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
      <Footer listMenuUser={listMenuUser} />
    </div>
  );
};

export default ChapterLessons;
