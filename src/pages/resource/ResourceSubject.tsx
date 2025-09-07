import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Fade,
  TextField
} from '@mui/material';
import {
  MenuBook as BookIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Row, Col, Container, Spinner } from 'react-bootstrap';
import chapterService from '../../services/chapterService';
import NavigationBar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { listMenuUser } from '../../config';
import { subjectConfig } from '../../config/subjects.tsx';

interface ResourceSubjectProps {
  subject: 0 | 1; // 0: Toán học, 1: Vật lý
}

const gradeLabels = ['Lớp 10', 'Lớp 11', 'Lớp 12'];

const ResourceSubject: React.FC<ResourceSubjectProps> = ({ subject }) => {
  const navigate = useNavigate();
  const [grade, setGrade] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    chapterService.getChapters({ subject, grade, size: 1000 })
      .then((res: { list: any[] }) => {
        setChapters(res.list);
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải chương.');
        setLoading(false);
      });
  }, [subject, grade]);

  const currentSubject = subjectConfig[subject];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavigationBar listMenuUser={listMenuUser} />

      {/* Hero Section */}
      <div className={`${currentSubject.color} relative overflow-hidden text-white`}>
        {/* background decor */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-black/20 blur-3xl" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(243,112,33,0.25) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
        </div>

        <Container className="py-14 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge + icon */}
            <div className="inline-flex items-center gap-3 bg-black/90 text-gray-800 px-4 py-2 rounded-full shadow-sm mb-2 mt-2">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-full"
                style={{ backgroundColor: '#fff', color: '#f37021' }}
              >
                {currentSubject.icon}
              </span>
              <span className="font-semibold text-black">{currentSubject.title}</span>
            </div>

            {/* Title + subtitle */}
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-primary">
              Học {currentSubject.title.toLowerCase()} theo chương, rõ ràng và trực quan
            </h1>
            <p className="mt-3 text-black text-lg">
              Khám phá kiến thức qua các chương được thiết kế khoa học và dễ hiểu.
            </p>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Box className="flex-grow py-10 relative z-10 mb-4">
        <Container>
          {/* Grade Selection */}
          <div className="mb-10">
            <p className="text-center text-gray-600 mb-3 text-lg">
              Chọn cấp độ phù hợp để bắt đầu
            </p>
            <div className="flex justify-center">
              <Box className="bg-white rounded-full p-1 shadow-lg border border-gray-100">
                <Tabs
                  value={grade}
                  onChange={(_, v) => setGrade(v)}
                  aria-label="Chọn khối lớp"
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 48,
                      borderRadius: '9999px',
                      m: '0 4px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2.5,
                    },
                    '& .Mui-selected': {
                      backgroundColor: 'var(--bs-primary)',
                      color: '#fff !important',
                    },
                    '& .MuiTabs-indicator': { display: 'none' },
                    // focus ring cho accessibility
                    '& .MuiTab-root:focus-visible': {
                      outline: '3px solid rgba(59,130,246,.5)', // blue-500/50
                      outlineOffset: 2,
                    },
                  }}
                >
                  {gradeLabels.map((label) => (
                    <Tab key={label} label={label} />
                  ))}
                </Tabs>
              </Box>
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <Fade in={loading}>
              <div className="flex flex-col items-center justify-center py-20 w-100">
                <Spinner animation="border" role="status" variant={subject === 0 ? 'primary' : 'success'} style={{ width: 60, height: 60, marginBottom: 16 }}>
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <Typography className="text-gray-600 mb-8">
                  Đang tải nội dung...
                </Typography>
              </div>
            </Fade>
          ) : error ? (
            <div className="text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                <Typography color="error" className="text-lg font-medium">
                  {error}
                </Typography>
                <Typography className="text-gray-600 mt-2">
                  Vui lòng thử lại sau
                </Typography>
              </div>
            </div>
          ) : (
            <Fade in={!loading}>
              <div>
                {/* Search input */}
                <div className="flex justify-end mb-1">
                  <TextField
                    label="Tìm kiếm chương..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{
                      minWidth: 280,
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused': {
                          outline: '2px solid var(--bs-primary)',
                          boxShadow: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'transparent',
                          },
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'var(--bs-primary)',
                      },
                    }}
                  />
                </div>
                {(() => {
                  const filteredChapters = chapters.filter((chapter: any) =>
                    chapter.chapter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    chapter.chapter_description?.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  return filteredChapters.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                        <BookIcon className="text-4xl text-gray-400" />
                      </div>
                      <Typography variant="h6" className="text-gray-600 mb-2">
                        Không tìm thấy chương nào
                      </Typography>
                      <Typography className="text-gray-500">
                        Thử từ khóa khác hoặc kiểm tra lại nội dung
                      </Typography>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-8">
                        <Typography variant="h5" className="font-semibold text-gray-800">
                          {gradeLabels[grade]} - {filteredChapters.length} chương
                        </Typography>
                        <Chip
                          label={`${filteredChapters.length} chương`}
                          variant="outlined"
                          className="chip-primary"
                        />
                      </div>

                      <Row className="g-4">
                        {filteredChapters.map((chapter: any, index: number) => (
                          <Col xs={12} md={6} lg={4} key={chapter.id}>
                            <Fade in={true} timeout={300 + index * 100}>
                              <Card
                                onClick={() => navigate(`/lessons/chapter/${chapter.id}`, { state: { subject, grade } })}
                                className="h-100 border-0 shadow-sm transition-transform"
                                style={{
                                  borderRadius: 20,
                                  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                                  transition: 'transform 0.2s',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                              >
                                <CardContent className="p-5">
                                  <div className="flex items-center mb-4">
                                    <div
                                      className="flex items-center justify-center"
                                      style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        background: 'var(--bs-primary)',
                                        marginRight: 16,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <Typography variant="h6" style={{ color: 'white', fontWeight: 700 }}>
                                        {chapter.chapter_number}
                                      </Typography>
                                    </div>
                                    <Typography
                                      variant="h6"
                                      className="font-bold"
                                      style={{
                                        color: '#1f2937',
                                        fontSize: '1.15rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                      }}
                                      title={chapter.chapter_name}
                                    >
                                      {chapter.chapter_name}
                                    </Typography>
                                  </div>
                                  <Typography
                                    variant="body2"
                                    className="text-gray-600 mb-4"
                                    style={{
                                      minHeight: '3.2em',
                                      maxHeight: '3.2em',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}
                                  >
                                    {chapter.chapter_description || 'Mô tả chi tiết sẽ được cập nhật sớm'}
                                  </Typography>
                                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                    <Chip
                                      label="Xem chi tiết"
                                      size="small"
                                      variant="outlined"
                                      className="chip-primary text-xs"
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <Typography variant="caption" className="text-gray-500">
                                        Chương {index + 1}
                                      </Typography>
                                      <ArrowForwardIcon
                                        fontSize="small"
                                        sx={{
                                          color: 'var(--bs-primary)',
                                          transition: 'transform 0.2s',
                                          '&:hover': { transform: 'translateX(4px)' },
                                        }}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Fade>
                          </Col>
                        ))}
                      </Row>
                    </>
                  );
                })()}
              </div>
            </Fade>
          )}
        </Container>
      </Box>
      <Footer listMenuUser={listMenuUser} />
    </div>
  );
};

export default ResourceSubject;