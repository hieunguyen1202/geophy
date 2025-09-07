import React, { useState, useMemo, useEffect } from 'react';
import { Container, Button, Form, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { visuallyHidden } from '@mui/utils';
import Link from '@mui/material/Link';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import ContentManagerSidebar from '../../components/layout/ContentManagerSidebar';
import ContentManagerNavbar from '../../components/layout/ContentManagerNavbar';
import ContentManagerFooter from '../../components/layout/ContentManagerFooter';
import '../../styles/sidebar.css';
import '../../styles/questionslist.css';
import questionService from '../../services/questionService';
import { useLocation, Link as ReactRouterLink } from 'react-router-dom';
import { listMenuContentManager } from '../../config';
import 'katex/dist/katex.min.css';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Editor } from '@tinymce/tinymce-react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CircularProgress from '@mui/material/CircularProgress';
import { Stepper, Step, StepLabel } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MUIButton from '@mui/material/Button';
import chapterService from '../../services/chapterService';
import lessonService from '../../services/lessonService';
import { renderMathWithText } from '../../utils';
import { MathJaxContext } from 'better-react-mathjax';

interface Question {
  id: number;
  question_content: string;
  difficulty: number;
  grade: number;
  subject: number;
  chapter_id: number | null;
  lesson_id: number | null;
}

// Add types for editing
interface EditChoice {
  choice_content: string;
  is_correct: boolean;
  explanation?: string;
}
interface EditQuestion {
  id: number;
  question_content: string;
  difficulty: number;
  grade: number;
  subject: number;
  type: number;
  simulation_data: string | null;
  choices: EditChoice[];
  explanation?: string;
  chapter_id: number;
  lesson_id: number;
  answer?: string;
}
const contentStyle: React.CSSProperties = {
  display: 'block',
  maxWidth: 350,
  overflow: 'hidden',
  whiteSpace: 'nowrap', // Không xuống dòng
  wordBreak: 'break-word',
  textOverflow: 'ellipsis', // Hiển thị dấu ... nếu quá dài
};
const inlineBlockStyle = `
  p, tiny-math-block {
    display: inline;
    margin: 0;
    padding: 0;
  }
`;
function stripMediaTags(html: string) {
  return html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<video[\s\S]*?<\/video>/gi, '');
}

// Helper functions for sorting
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aValue = a[orderBy] as string | number | null;
  const bValue = b[orderBy] as string | number | null;

  if (bValue === null && aValue !== null) return -1;
  if (aValue === null && bValue !== null) return 1;
  if (aValue === null && bValue === null) return 0;

  if (bValue! < aValue!) {
    return -1;
  }
  if (bValue! > aValue!) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string | null },
  b: { [key in Key]: number | string | null },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Question;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'question_content',
    numeric: false,
    disablePadding: true,
    label: 'Nội Dung Câu Hỏi',
  },
  {
    id: 'difficulty',
    numeric: true,
    disablePadding: false,
    label: 'Độ Khó',
  },
  {
    id: 'grade',
    numeric: true,
    disablePadding: false,
    label: 'Khối Lớp',
  },
  {
    id: 'subject',
    numeric: true,
    disablePadding: false,
    label: 'Môn Học',
  },
  // Add chapter and lesson columns
  {
    id: 'chapter_id',
    numeric: true,
    disablePadding: false,
    label: 'Chương',
  },
  {
    id: 'lesson_id',
    numeric: true,
    disablePadding: false,
    label: 'Bài học',
  },
  {
    id: 'id', // Using ID for actions, though not directly sortable by it for display purposes
    numeric: true,
    disablePadding: false,
    label: 'Hành Động',
  },
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Question) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } =
    props;
  const createSortHandler =
    (property: keyof Question) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all questions',
            }}
          />
        </TableCell>
        <TableCell align="center" style={{ width: 60 }}>STT</TableCell>
        {headCells.filter(h => h.id !== 'id').map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'left' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id as keyof Question)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        <TableCell align="right">Hành Động</TableCell>
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  searchValue: string;
  onFilterChange: (column: keyof Question, value: string) => void;
  filters: { [key: string]: string };
  handleDeleteSelected: () => void;
  isDeleting: boolean;
  chapterMap: { [id: number]: string };
  lessonMap: { [id: number]: string };
  chapterLessonsMap: { [chapterId: number]: { id: number, name: string }[] };
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { numSelected, onSearchChange, searchValue, onFilterChange, filters, handleDeleteSelected, isDeleting, chapterMap, chapterLessonsMap } = props;
  const selectedChapterId = filters.chapter_id ? Number(filters.chapter_id) : null;
  const lessonsForChapter = selectedChapterId ? chapterLessonsMap[selectedChapterId] || [] : [];
  return (
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        },
        numSelected > 0 && {
          bgcolor: '#f37021',
          color: 'white',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        },
      ]}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} đã chọn
        </Typography>
      ) : (
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Danh Sách Câu Hỏi
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <div style={{ position: 'relative' }}>
          <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.5, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchValue}
            onChange={onSearchChange}
            style={{
              padding: '8px 8px 8px 32px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minWidth: '200px',
              color: 'black'
            }}
          />
        </div>

        {/* Filters */}
        <Form.Select
          size="sm"
          style={{ width: '150px' }}
          value={filters.difficulty || ''}
          onChange={(e) => onFilterChange('difficulty', e.target.value)}
        >
          <option value="">Độ Khó</option>
          <option value="0">Dễ</option>
          <option value="1">Trung Bình</option>
          <option value="2">Khó</option>
        </Form.Select>

        {/* Chapter Filter */}
        <Form.Select
          size="sm"
          style={{ width: '150px' }}
          value={filters.chapter_id || ''}
          onChange={(e) => onFilterChange('chapter_id', e.target.value)}
        >
          <option value="">Chương</option>
          {Object.entries(chapterMap).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </Form.Select>

        {/* Lesson Filter */}
        <Form.Select
          size="sm"
          style={{ width: '150px' }}
          value={filters.lesson_id || ''}
          onChange={(e) => onFilterChange('lesson_id', e.target.value)}
          disabled={!filters.chapter_id}
        >
          <option value="">Bài học</option>
          {lessonsForChapter.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </Form.Select>

        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton onClick={handleDeleteSelected} disabled={isDeleting}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Toolbar>
  );
}

interface CustomPaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
}

function CustomPaginationActions(props: CustomPaginationActionsProps) {
  const { count, page, rowsPerPage, onPageChange } = props;
  const totalPages = Math.ceil(count / rowsPerPage);

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handlePageButtonClick = (event: React.MouseEvent<HTMLButtonElement>, pageNum: number) => {
    onPageChange(event, pageNum);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPage = parseInt(e.target.value, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      onPageChange(null, newPage - 1); // Convert to 0-indexed page
    }
  };

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
      <Button
        onClick={handleBackButtonClick}
        disabled={page === 0}
        className="pagination-button-outline"
      >
        {'<<'}
      </Button>

      {getVisiblePages().map((pageNum, index) => {
        if (pageNum === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2" style={{
              color: '#666',
              fontWeight: 'bold',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '32px'
            }}>
              ...
            </span>
          );
        }

        const actualPageNum = pageNum as number;
        return (
          <Button
            key={actualPageNum}
            className={page === actualPageNum - 1 ? 'pagination-button-active' : 'pagination-button-outline'}
            onClick={(event) => handlePageButtonClick(event, actualPageNum - 1)}
          >
            {actualPageNum}
          </Button>
        );
      })}

      <Button
        onClick={handleNextButtonClick}
        disabled={page >= totalPages - 1}
        className="pagination-button-outline"
      >
        {'>>'}
      </Button>

      <div className="d-flex align-items-center gap-1" style={{ marginRight: '20px' }}>
        <span>Đi đến trang:</span>
        <Form.Control
          type="number"
          min="1"
          max={totalPages}
          value={page + 1}
          onChange={handleInputChange}
          size="sm"
          style={{ width: '70px' }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const newPage = parseInt((e.target as HTMLInputElement).value, 10);
              if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
                onPageChange(null, newPage - 1);
              }
            }
          }}
        />
      </div>
    </Box>
  );
}


const QuestionsList: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Question>('id');
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<EditQuestion | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  // Stepper states
  const [activeStep, setActiveStep] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  // Lấy subject mặc định từ localStorage (mặc định 0 nếu chưa có)
  const [selectedSubject, setSelectedSubject] = useState<number>(() =>
    Number(localStorage.getItem('subject') ?? '0')
  );
  const [chapterMap, setChapterMap] = useState<{ [id: number]: string }>({});
  const [lessonMap, setLessonMap] = useState<{ [id: number]: string }>({});
  const [chapterLessonsMap, setChapterLessonsMap] = useState<{ [chapterId: number]: { id: number, name: string }[] }>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<EditQuestion | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const difficultyMap: { [key: number]: string } = useMemo(() => ({
    0: 'Dễ',
    1: 'Trung Bình',
    2: 'Khó',
  }), []);

  const gradeMap: { [key: number]: string } = useMemo(() => ({
    0: 'Lớp 10',
    1: 'Lớp 11',
    2: 'Lớp 12',
  }), []);

  const subjectMap: { [key: number]: string } = useMemo(() => ({
    0: 'Toán học',
    1: 'Vật lý',
  }), []);
  useEffect(() => {
    const stored = Number(localStorage.getItem('subject') ?? '0');
    localStorage.setItem('selectedSubject', stored.toString());
  }, []); // [] = chỉ chạy 1 lần khi mount

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Always fetch all questions for FE filtering
        const data = await questionService.getQuestions({
          page: 0,
          size: 10000,
          sort: 'id,asc',
        });
        setAllQuestions(data.list);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };
    fetchQuestions();
  }, [location.key]);

  // Fetch questions after grade and subject are selected
  useEffect(() => {
    if (activeStep === 3 && selectedGrade !== null && selectedSubject !== null) {
      const fetchQuestions = async () => {
        try {
          const data = await questionService.getQuestions({
            page: 0,
            size: 10000,
            sort: 'id,asc',
            filters: {
              subject: selectedSubject,
              grade: selectedGrade,
            },
          });
          setAllQuestions(data.list);
        } catch (error) {
          setAllQuestions([]);
        }
      };
      fetchQuestions();
    }
  }, [activeStep, selectedGrade, selectedSubject]);

  // Fetch chapters and lessons for mapping
  const fetchChaptersAndLessons = async () => {
    try {
      // Fetch all chapters for the selected grade/subject, or all if not selected
      const chaptersData = await chapterService.getChapters({
        page: 0,
        size: 1000,
        sort: 'id,asc',
        grade: selectedGrade ?? undefined,
        subject: selectedSubject ?? undefined,
      });
      const chapters = chaptersData.list;
      const chapterMapObj: { [id: number]: string } = {};
      chapters.forEach((c: any) => {
        chapterMapObj[c.id] = c.chapter_name;
      });
      setChapterMap(chapterMapObj);
      // Fetch all lessons for all chapters
      let allLessons: any[] = [];
      const chapterLessons: { [chapterId: number]: { id: number, name: string }[] } = {};
      await Promise.all(
        chapters.map(async (chapter: any) => {
          const lessons = await lessonService.getLessons({
            subject: chapter.subject,
            grade: chapter.grade,
            chapter_id: chapter.id,
            size: 1000,
            sort: 'id,asc'
          });
          allLessons = allLessons.concat(lessons.list);
          // Use lesson.chapter_id from API response for mapping
          lessons.list.forEach((l: any) => {
            if (!chapterLessons[l.chapter_id]) chapterLessons[l.chapter_id] = [];
            chapterLessons[l.chapter_id].push({ id: l.id, name: l.name });
          });
        })
      );
      const lessonMapObj: { [id: number]: string } = {};
      allLessons.forEach((l: any) => {
        lessonMapObj[l.id] = l.name;
      });
      setLessonMap(lessonMapObj);
      setChapterLessonsMap(chapterLessons);
    } catch (err) {
      setChapterMap({});
      setLessonMap({});
      setChapterLessonsMap({});
    }
  };

  useEffect(() => {
    fetchChaptersAndLessons();
  }, [selectedGrade, selectedSubject, location.key]);

  // FE search, filter, sort
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = allQuestions;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id?.toString().includes(searchTerm)
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filtered = filtered.filter(q => {
          if (key === 'chapter_id') {
            // Use chapterLessonsMap to check if the question's lesson belongs to the selected chapter
            const lessonsInChapter = chapterLessonsMap[Number(value)] || [];
            return lessonsInChapter.some(lesson => lesson.id === q.lesson_id);
          }

          if (key === 'lesson_id') {
            return q.lesson_id === Number(value);
          }

          return String(q[key as keyof Question]) === String(value);
        });
      }
    });

    // Sort
    const sorted = [...filtered].sort(getComparator(order, orderBy));
    return sorted;
  }, [allQuestions, searchTerm, filters, order, orderBy, chapterLessonsMap]);

  // Pagination
  const paginatedQuestions = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return rowsPerPage === 10000 ? filteredAndSortedQuestions : filteredAndSortedQuestions.slice(start, end);
  }, [filteredAndSortedQuestions, page, rowsPerPage]);

  // Update total and questions for table
  useEffect(() => {
    setQuestions(paginatedQuestions);
    setTotal(filteredAndSortedQuestions.length);
  }, [paginatedQuestions, filteredAndSortedQuestions]);

  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof Question,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = questions.map((n: Question) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (_event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (value === -1) {
      setRowsPerPage(10000); // Large number to fetch all
    } else {
      setRowsPerPage(value);
    }
    setPage(0);
  };

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };


  const handleFilterChange = (column: keyof Question, value: string) => {
    setFilters((prevFilters) => {
      let newFilters = { ...prevFilters, [column]: value };
      if (value === '') {
        delete newFilters[column];
      }
      // If changing chapter, reset lesson filter if lesson does not belong to new chapter
      if (column === 'chapter_id') {
        const lessons = chapterLessonsMap[Number(value)] || [];
        if (!lessons.some(l => l.id === Number(prevFilters.lesson_id))) {
          delete newFilters.lesson_id;
        }
      }
      // If changing lesson, auto-set chapter filter to the correct chapter for that lesson
      if (column === 'lesson_id') {
        let foundChapterId: number | null = null;
        Object.entries(chapterLessonsMap).forEach(([chapterId, lessons]) => {
          if (lessons.some(l => l.id === Number(value))) {
            foundChapterId = Number(chapterId);
          }
        });
        if (foundChapterId) {
          newFilters.chapter_id = String(foundChapterId);
        } else {
          delete newFilters.chapter_id;
        }
      }
      return newFilters;
    });
    setPage(0);
  };

  const handleEdit = async (question: Question) => {
    try {
      const data = await questionService.getQuestionById(question.id);
      setEditQuestion({
        id: data.id,
        question_content: data.question_content,
        difficulty: data.difficulty,
        grade: data.grade,
        subject: data.subject,
        type: data.question_type,
        simulation_data: data.simulation_data,
        choices: data.choices.map((c: any) => ({
          choice_id: c.id,
          choice_content: c.content,
          is_correct: c.is_correct,
          explanation: c.explanation || '',
        })),
        explanation: '', // for UI, not sent directly
        chapter_id: data.chapter_id,
        lesson_id: data.lesson_id,
      });
      // If chapter_id is not set or 0, infer from lesson_id
      setEditQuestion(prev => {
        if (!prev) return prev;
        if (prev.chapter_id && prev.chapter_id !== 0) return prev;
        // Find the chapter that contains the lesson_id
        let foundChapterId = 0;
        Object.entries(chapterLessonsMap).forEach(([chapterId, lessons]) => {
          if (lessons.some((l: any) => l.id === prev.lesson_id)) {
            foundChapterId = Number(chapterId);
          }
        });
        return foundChapterId ? { ...prev, chapter_id: foundChapterId } : prev;
      });
      setEditModalOpen(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Không thể tải dữ liệu câu hỏi!', severity: 'error' });
    }
  };

  const handleEditFieldChange = (field: keyof EditQuestion, value: any) => {
    if (!editQuestion) return;
    setEditQuestion({ ...editQuestion, [field]: value });
  };
  const handleEditChoiceChange = (index: number, field: keyof EditChoice, value: any) => {
    if (!editQuestion) return;
    const updatedChoices = [...editQuestion.choices];
    updatedChoices[index] = { ...updatedChoices[index], [field]: value };
    setEditQuestion({ ...editQuestion, choices: updatedChoices });
  };
  const handleEditAddChoice = () => {
    if (!editQuestion) return;
    setEditQuestion({
      ...editQuestion,
      choices: [...editQuestion.choices, { choice_content: '', is_correct: false }],
    });
  };
  const handleEditRemoveChoice = (index: number) => {
    if (!editQuestion) return;
    setEditQuestion({
      ...editQuestion,
      choices: editQuestion.choices.filter((_, i) => i !== index),
    });
  };
  const handleEditSave = async () => {
    if (!editQuestion) return;
    // Validation: single and multiple choice must have at least 2 answer choices
    if ((editQuestion.type === 0 || editQuestion.type === 1) && editQuestion.choices.length < 2) {
      setSnackbar({ open: true, message: 'Câu hỏi một lựa chọn hoặc nhiều lựa chọn phải có ít nhất 2 đáp án!', severity: 'warning' });
      return;
    }
    setIsUpdating(true);
    try {
      // Only include explanation for correct choices
      const payload = {
        id: editQuestion.id,
        question_content: editQuestion.question_content,
        difficulty: editQuestion.difficulty,
        grade: editQuestion.grade,
        subject: editQuestion.subject,
        type: editQuestion.type,
        simulation_data: editQuestion.simulation_data,
        choices: editQuestion.choices.map((c) =>
          c.is_correct
            ? { choice_content: c.choice_content, is_correct: c.is_correct, explanation: editQuestion.explanation?.trim() ? editQuestion.explanation : 'N/A' }
            : { choice_content: c.choice_content, is_correct: c.is_correct }
        ),
        lesson_id: editQuestion.lesson_id,
        answer: editQuestion.answer?.trim() || '',
      };
      await questionService.updateQuestion(editQuestion.id, payload);
      setSnackbar({ open: true, message: 'Cập nhật câu hỏi thành công!', severity: 'success' });
      setEditModalOpen(false);
      setEditQuestion(null);
      // Refresh list
      const refreshData = await questionService.getQuestions({
        page: 0,
        size: 10000,
        sort: 'id,asc',
        filters: {
          subject: editQuestion.subject,
          grade: editQuestion.grade
        }
      });
      setAllQuestions(refreshData.list);
      // Refresh chapters and lessons asynchronously
      fetchChaptersAndLessons();
    } catch (error: any) {
      let messages: string[] = [];
      if (error.response && error.response.data) {
        if (Array.isArray(error.response.data.messages)) {
          messages = error.response.data.messages;
        } else if (Array.isArray(error.response.data.message)) {
          messages = error.response.data.message;
        } else if (typeof error.response.data.message === 'string') {
          messages = [error.response.data.message];
        } else if (typeof error.response.data === 'string') {
          messages = [error.response.data];
        }
      }
      if (messages.length === 0) {
        messages = [error?.message || 'Lỗi không xác định'];
      }
      setSnackbar({ open: true, message: messages.join(', '), severity: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };
  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditQuestion(null);
  };

  const handleDelete = (question: Question) => {
    setDeleteTarget(question);
    setShowDeleteModal(true);
  };

  const handleDeleteSelected = () => {
    if (selected.length > 0) {
      setDeleteTarget(null);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget) {
        await questionService.deleteQuestions([deleteTarget.id]);
      } else if (selected.length > 0) {
        await questionService.deleteQuestions(selected as number[]);
      }
      // Refresh questions
      const refreshData = await questionService.getQuestions({
        page: 0,
        size: 10000,
        sort: 'id,asc',
      });
      setAllQuestions(refreshData.list);
      setSelected([]);
      setSnackbar({ open: true, message: 'Xóa thành công!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Xóa thất bại. Vui lòng thử lại.', severity: 'error' });
      console.error('Error deleting questions:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };
  const getChapterIdFromLesson = (lessonId: number | null): number | null => {
    if (!lessonId) return null;

    let foundChapterId: number | null = null;
    Object.entries(chapterLessonsMap).forEach(([chapterId, lessons]) => {
      if (lessons.some(lesson => lesson.id === lessonId)) {
        foundChapterId = Number(chapterId);
      }
    });
    return foundChapterId;
  };
  const handleViewDetail = async (question: Question) => {
    setIsLoadingDetail(true);
    try {
      const data = await questionService.getQuestionById(question.id);
      const chapterId = getChapterIdFromLesson(data.lesson_id);

      setDetailQuestion({
        id: data.id,
        question_content: data.question_content,
        difficulty: data.difficulty,
        grade: data.grade,
        subject: data.subject,
        type: data.question_type,
        simulation_data: data.simulation_data,
        choices: data.choices.map((c: any) => ({
          choice_id: c.id,
          choice_content: c.content,
          is_correct: c.is_correct,
          explanation: c.explanation || '',
        })),
        explanation: data.explanation || '',
        chapter_id: chapterId ?? 0,
        lesson_id: data.lesson_id,
        answer: data.answer || '',
      });
      setDetailModalOpen(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Không thể tải chi tiết câu hỏi!', severity: 'error' });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // Modern Stepper UI with MUI Stepper
  const renderStepCards = () => {
    // Tính index cho Stepper (0: chọn khối, 1: xem câu hỏi)
    const stepIndex = activeStep >= 3 ? 1 : 0;

    // Stepper component at the top
    const StepperHeader = () => (
      <div className="mb-8">
        <Stepper activeStep={stepIndex} alternativeLabel className="mb-6">
          <Step color="primary">
            <StepLabel>Chọn khối lớp</StepLabel>
          </Step>
          <Step color="primary">
            <StepLabel>Xem danh sách câu hỏi</StepLabel>
          </Step>
        </Stepper>
      </div>
    );

    if (activeStep === 1) {
      return (
        <div className="min-h-[60vh] bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <StepperHeader />
          <div className="d-flex justify-content-center">
            <Card
              className="shadow-xl border-0 rounded-3xl overflow-hidden"
              style={{ maxWidth: '500px', width: '100%' }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-black p-4">
                <Typography variant="h5" className="text-center font-bold">
                  Chọn khối lớp
                </Typography>
                <Typography variant="body2" className="text-center opacity-90 mt-1">
                  Vui lòng chọn khối lớp phù hợp
                </Typography>
              </div>
              <CardContent className="p-6">
                <div className="row g-3">
                  {[0, 1, 2].map((grade) => (
                    <div key={grade} className="col-12">
                      <MUIButton
                        variant={selectedGrade === grade ? 'contained' : 'outlined'}
                        color="primary"
                        className={`w-100 py-3 rounded-2xl font-semibold transition-all duration-300 ${selectedGrade === grade
                          ? 'shadow-lg transform scale-105'
                          : 'hover:shadow-md hover:transform hover:scale-102'
                          }`}
                        size="medium"
                        onClick={() => {
                          setSelectedGrade(grade);
                          localStorage.setItem('selectedGrade', String(grade));
                        }}
                        startIcon={
                          selectedGrade === grade ? <CheckCircleIcon /> : <SchoolIcon />
                        }
                      >
                        {gradeMap[grade]}
                      </MUIButton>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardActions className="p-4 bg-gray-50">
                <div className="d-flex justify-content-end w-100">
                  <MUIButton
                    variant="contained"
                    color="primary"
                    size="medium"
                    className="px-6 py-2 rounded-2xl font-semibold"
                    disabled={selectedGrade === null}
                    onClick={() => {
                      // Bảo đảm có subject trong localStorage (mặc định = 0)
                      if (localStorage.getItem('subject') == null) {
                        localStorage.setItem('subject', '0');
                      }
                      // Bỏ qua bước chọn môn, đi thẳng tới bước xem câu hỏi
                      setActiveStep(3);
                    }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Tiếp tục
                  </MUIButton>
                </div>
              </CardActions>
            </Card>
          </div>
        </div>
      );
    }

    // Không còn bước 2 (Chọn môn học) nữa
    return null;
  };

  return (
    <>
      <ContentManagerSidebar onCollapse={setSidebarCollapsed} />
      <ContentManagerNavbar collapsed={sidebarCollapsed} />
      <ContentManagerFooter collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Breadcrumb and Title always at top left */}
        <div className="mb-6 mt-2">
          <Breadcrumbs aria-label="breadcrumb" className="mb-2">
            <Link component={ReactRouterLink} to="/content-manager/dashboard" color="inherit" underline="hover">
              Tổng quan
            </Link>
            <Link component={ReactRouterLink} to={location.pathname} color="text.primary" underline="hover" aria-current="page">
              {listMenuContentManager.find(item => item.path === location.pathname)?.name || 'Danh Sách Câu Hỏi'}
            </Link>
          </Breadcrumbs>
        </div>
        <Container fluid>
          {activeStep < 3 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              {renderStepCards()}
            </div>
          ) : (
            <>
              {/* Inline Back and Add Question Buttons */}
              {activeStep === 3 && (
                <div className="d-flex justify-content-between mb-3">
                  <MUIButton
                    variant="outlined"
                    color="primary"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setActiveStep(1)}
                  >
                    Quay lại chọn khối lớp
                  </MUIButton>
                  <ReactRouterLink to="/content-manager/question/add-question" className="btn btn-primary d-flex align-items-center gap-2">
                    <FaPlus className="me-2" /> Thêm câu hỏi
                  </ReactRouterLink>
                </div>
              )}
              <Box sx={{ width: '100%' }}>
                <Paper sx={{ width: '100%', mb: 2 }}>
                  <EnhancedTableToolbar
                    numSelected={selected.length}
                    onSearchChange={handleSearchChange}
                    searchValue={searchTerm}
                    onFilterChange={handleFilterChange}
                    filters={filters}
                    handleDeleteSelected={handleDeleteSelected}
                    isDeleting={isDeleting}
                    chapterMap={chapterMap}
                    lessonMap={lessonMap}
                    chapterLessonsMap={chapterLessonsMap}
                  />
                  <TableContainer>
                    <Table
                      sx={{ minWidth: 750 }}
                      aria-labelledby="tableTitle"
                      size={dense ? 'small' : 'medium'}
                    >
                      <EnhancedTableHead
                        numSelected={selected.length}
                        order={order}
                        orderBy={orderBy as string}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={questions.length}
                      />
                      <TableBody>
                        {questions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} sx={{ textAlign: 'center', py: 3 }}>
                              {searchTerm || Object.keys(filters).length > 0
                                ? 'Không tìm thấy kết quả'
                                : 'Không có dữ liệu để hiển thị'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          questions.map((row: Question, index: number) => {
                            const isItemSelected = isSelected(row.id);
                            const labelId = `enhanced-table-checkbox-${index}`;
                            return (
                              <TableRow
                                hover
                                onClick={(event) => handleClick(event, row.id)}
                                role="checkbox"
                                aria-checked={isItemSelected}
                                tabIndex={-1}
                                key={row.id}
                                selected={isItemSelected}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    color="primary"
                                    checked={isItemSelected}
                                    inputProps={{
                                      'aria-labelledby': labelId,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center">{index + 1 + page * rowsPerPage}</TableCell>
                                <TableCell
                                  component="th"
                                  id={labelId}
                                  scope="row"
                                  padding="none"
                                >
                                  <style>{inlineBlockStyle}</style>
                                  <span title={row.question_content} style={contentStyle}>
                                    <span
                                      dangerouslySetInnerHTML={{ __html: stripMediaTags(row.question_content) }}
                                    />
                                  </span>
                                </TableCell>
                                <TableCell align="left">
                                  <span
                                    className={`badge bg-${row.difficulty === 0
                                      ? 'success'
                                      : row.difficulty === 1
                                        ? 'warning'
                                        : 'danger'
                                      }`}
                                  >
                                    {difficultyMap[row.difficulty] || 'Chưa xác định'}
                                  </span>
                                </TableCell>
                                <TableCell align="left">{gradeMap[row.grade] || 'Chưa xác định'}</TableCell>
                                <TableCell align="left">{subjectMap[row.subject] || 'Chưa xác định'}</TableCell>
                                <TableCell align="left">
                                  {/* Find chapter_id by lesson_id if not present */}
                                  {(() => {
                                    let chapterId = row.chapter_id;
                                    if (!chapterId && row.lesson_id) {
                                      for (const [cid, lessons] of Object.entries(chapterLessonsMap)) {
                                        if (lessons.some((l: any) => l.id === row.lesson_id)) {
                                          chapterId = Number(cid);
                                          break;
                                        }
                                      }
                                    }
                                    return chapterId ? (chapterMap[chapterId] || chapterId) : '-';
                                  })()}
                                </TableCell>
                                <TableCell align="left">
                                  {row.lesson_id ? (lessonMap[row.lesson_id] || row.lesson_id) : '-'}
                                </TableCell>
                                <TableCell align="right">
                                  <div>
                                    <Button
                                      variant="link"
                                      className="text-info p-0 me-2"
                                      onClick={(e) => { e.stopPropagation(); handleViewDetail(row); }}
                                    >
                                      <FaEye />
                                    </Button>
                                    <Button
                                      variant="link"
                                      className="text-primary p-0 me-2"
                                      onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                    >
                                      <FaEdit />
                                    </Button>

                                    <Button
                                      variant="link"
                                      className="text-danger p-0"
                                      onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                      disabled={isDeleting}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, { label: 'Tất cả', value: -1 }]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage === 10000 ? -1 : rowsPerPage}
                    page={rowsPerPage === 10000 ? 0 : page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={CustomPaginationActions}
                    labelRowsPerPage="Số hàng mỗi trang:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`
                    }
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
                </Paper>
                <FormControlLabel
                  control={<Switch checked={dense} onChange={handleChangeDense} />}
                  label="Thu gọn hiển thị"
                />
              </Box>
            </>
          )}
        </Container>
      </main>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} dialogClassName="modal-top-center">
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteTarget
            ? (() => {
              const idx = questions.findIndex(q => q.id === deleteTarget.id);
              const stt = idx !== -1 ? idx + 1 + page * rowsPerPage : deleteTarget.id;
              return `Bạn có chắc chắn muốn xóa câu hỏi này? (STT: ${stt})`;
            })()
            : `Bạn có chắc chắn muốn xóa ${selected.length} câu hỏi đã chọn?`}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="primary" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="snackbar-below-navbar">
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ top: { xs: 70, sm: 70 } }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
      {/* Edit Question Modal */}
      {editModalOpen && editQuestion && (
        <Modal show={editModalOpen} onHide={handleEditCancel} dialogClassName="modal-xl" backdrop="static" keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>Chỉnh sửa câu hỏi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <div className="row">
                <div className="col-md-7">
                  <Form.Group className="mb-3">
                    <Form.Label>Nội Dung Câu Hỏi</Form.Label>
                    <Editor
                      value={editQuestion.question_content}
                      apiKey='wk5v67fk6x4f5vr0d4lbwmanudtpgsdnk8m1yoftuz9fyoax'
                      init={{
                        height: 400,
                        menubar: true,
                        plugins: [
                          'math', 'advlist', 'anchor', 'autolink', 'charmap', 'code', 'codesample', 'fullscreen',
                          'help', 'image', 'insertdatetime', 'link', 'lists', 'media',
                          'preview', 'searchreplace', 'table', 'visualblocks',
                        ],
                        toolbar:
                          'math | codesample | undo redo | styles | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
                        inline: false,
                      }}
                      onEditorChange={(content: string) => handleEditFieldChange('question_content', content)}
                    />
                  </Form.Group>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Form.Group className="mb-3" style={{ flex: 1 }}>
                      <Form.Label>Khối Lớp</Form.Label>
                      <Form.Select
                        value={editQuestion.grade}
                        onChange={e => handleEditFieldChange('grade', Number(e.target.value))}
                        disabled={isUpdating}
                      >
                        <option value={0}>Lớp 10</option>
                        <option value={1}>Lớp 11</option>
                        <option value={2}>Lớp 12</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" style={{ flex: 1 }}>
                      <Form.Label>Môn Học</Form.Label>
                      <Form.Select
                        value={editQuestion.subject}
                        onChange={e => handleEditFieldChange('subject', Number(e.target.value))}
                        disabled={isUpdating}
                      >
                        <option value={0}>Toán học</option>
                        <option value={1}>Vật lý</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Chương</Form.Label>
                    <Form.Select
                      value={editQuestion.chapter_id ?? 0}
                      onChange={e => {
                        const newChapterId = e.target.value ? Number(e.target.value) : 0;
                        const lessonsForChapter: { id: number; name: string }[] = chapterLessonsMap[newChapterId] || [];
                        const lessonIds = lessonsForChapter.map((l: { id: number }) => l.id);
                        setEditQuestion(q => q ? {
                          ...q,
                          chapter_id: newChapterId,
                          lesson_id: lessonIds.includes(q.lesson_id) ? q.lesson_id : 0,
                        } : q);
                      }}
                      disabled={isUpdating}
                    >
                      <option value="">Chọn chương</option>
                      {Object.entries(chapterMap).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Bài học</Form.Label>
                    <Form.Select
                      value={editQuestion.lesson_id ?? 0}
                      onChange={e => setEditQuestion(q => q ? { ...q, lesson_id: e.target.value ? Number(e.target.value) : 0 } : q)}
                      disabled={!editQuestion.chapter_id || isUpdating}
                    >
                      <option value="">Chọn bài học</option>
                      {(editQuestion.chapter_id && chapterLessonsMap[editQuestion.chapter_id]) ?
                        chapterLessonsMap[editQuestion.chapter_id].map(les => (
                          <option key={les.id} value={les.id}>{les.name}</option>
                        )) : null}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-5">
                  {[0, 1].includes(editQuestion.type) && (
                    <Form.Group className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0">Các Lựa Chọn Câu Trả Lời</Form.Label>
                        <Button variant="outline-primary" onClick={handleEditAddChoice} disabled={isUpdating}>
                          <FaPlus />
                        </Button>
                      </div>
                      {editQuestion.choices.map((choice, idx) => (
                        <div key={idx} className="d-flex mb-2 align-items-center">
                          <Form.Control
                            type="text"
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}`}
                            value={choice.choice_content}
                            onChange={e => handleEditChoiceChange(idx, 'choice_content', e.target.value)}
                            className="me-2"
                          />
                          <Form.Check
                            type={editQuestion.type === 0 ? 'radio' : 'checkbox'}
                            label="Đúng"
                            checked={choice.is_correct}
                            onChange={e => {
                              if (editQuestion.type === 0) {
                                // Single choice: only one correct
                                const updated = editQuestion.choices.map((c, i) => ({ ...c, is_correct: i === idx ? e.target.checked : false }));
                                setEditQuestion({ ...editQuestion, choices: updated });
                              } else {
                                handleEditChoiceChange(idx, 'is_correct', e.target.checked);
                              }
                            }}
                            className="me-2"
                          />
                          {editQuestion.choices.length > 1 && (
                            <Button variant="outline-danger" onClick={() => handleEditRemoveChoice(idx)} disabled={isUpdating}>
                              Xóa
                            </Button>
                          )}
                        </div>
                      ))}
                    </Form.Group>
                  )}
                  {editQuestion.type === 3 && (
                    <Form.Group className="mb-3">
                      <Form.Label>Câu Trả Lời Đúng/Sai</Form.Label>
                      <Form.Check
                        type="radio"
                        label="Đúng"
                        name="editTrueFalseAnswer"
                        checked={editQuestion.choices[0]?.is_correct === true}
                        onChange={() => setEditQuestion({ ...editQuestion, choices: [{ choice_content: 'True', is_correct: true }] })}
                        id="editTrueFalseTrue"
                        className="mb-2"
                      />
                      <Form.Check
                        type="radio"
                        label="Sai"
                        name="editTrueFalseAnswer"
                        checked={editQuestion.choices[0]?.is_correct === false}
                        onChange={() => setEditQuestion({ ...editQuestion, choices: [{ choice_content: 'False', is_correct: false }] })}
                        id="editTrueFalseFalse"
                      />
                    </Form.Group>
                  )}
                  {editQuestion.type === 4 && (
                    <Form.Group className="mb-3">
                      <Form.Label>Nội Dung Câu Trả Lời</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={editQuestion.choices[0]?.choice_content || ''}
                        onChange={e => setEditQuestion({ ...editQuestion, choices: [{ choice_content: e.target.value, is_correct: true }] })}
                      />
                    </Form.Group>
                  )}
                  {editQuestion.type === 2 && (
                    <Form.Group className="mb-3">
                      <Form.Label>Đáp án</Form.Label>
                      <Form.Control
                        type="text"
                        value={editQuestion.answer || ''}
                        onChange={(e) => setEditQuestion({
                          ...editQuestion,
                          answer: e.target.value,
                          choices: [{ choice_content: e.target.value, is_correct: true }]
                        })}
                        placeholder="Nhập đáp án"
                      />
                    </Form.Group>
                  )}
                  {editQuestion.choices.some(choice => choice.is_correct) && (
                    <Form.Group className="mb-3">
                      <Form.Label>Giải thích (Explanation)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Nhập giải thích cho đáp án đúng (nếu có)"
                        value={editQuestion.explanation || ''}
                        onChange={e => handleEditFieldChange('explanation', e.target.value)}
                      />
                    </Form.Group>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label>Loại Câu Hỏi</Form.Label>
                    <Form.Select
                      value={editQuestion.type}
                      onChange={e => handleEditFieldChange('type', Number(e.target.value))}
                      disabled={isUpdating}
                    >
                      <option value={0}>Một lựa chọn</option>
                      <option value={1}>Nhiều lựa chọn</option>
                      {/* <option value={2}>Điền vào chỗ trống</option>
                      <option value={3}>Đúng/Sai</option> */}
                      {/* <option value={4}>Mô phỏng</option>
                      <option value={5}>Tự luận</option> */}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Độ Khó</Form.Label>
                    <Form.Select
                      value={editQuestion.difficulty}
                      onChange={e => handleEditFieldChange('difficulty', Number(e.target.value))}
                      disabled={isUpdating}
                    >
                      <option value={0}>Dễ</option>
                      <option value={1}>Trung Bình</option>
                      <option value={2}>Khó</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleEditCancel} disabled={isUpdating}>Hủy</Button>
            <Button variant="primary" onClick={handleEditSave} disabled={isUpdating}>Lưu</Button>
          </Modal.Footer>
        </Modal>
      )}
      {/* Detail Question Modal */}
      {detailModalOpen && detailQuestion && (
        <Modal show={detailModalOpen} onHide={() => setDetailModalOpen(false)} dialogClassName="modal-xl" backdrop="static" keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết câu hỏi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isLoadingDetail || !detailQuestion ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <CircularProgress />
              </div>
            ) : (
              <div>
                <h5>Nội dung câu hỏi:</h5>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <span dangerouslySetInnerHTML={{ __html: stripMediaTags(detailQuestion.question_content) }} />
                </div>
                <div className="row mb-3">
                  <div className="col-md-4"><b>Khối lớp:</b> {gradeMap[detailQuestion.grade]}</div>
                  <div className="col-md-4"><b>Môn học:</b> {subjectMap[detailQuestion.subject]}</div>
                  <div className="col-md-4"><b>Độ khó:</b> {difficultyMap[detailQuestion.difficulty]}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4">
                    <b>Chương:</b> {(() => {
                      const chapterId = detailQuestion.chapter_id;
                      if (chapterId && chapterMap[chapterId]) {
                        return chapterMap[chapterId];
                      }
                      // Fallback: find chapter by lesson_id
                      if (detailQuestion.lesson_id) {
                        for (const [cid, lessons] of Object.entries(chapterLessonsMap)) {
                          if (lessons.some(l => l.id === detailQuestion.lesson_id)) {
                            return chapterMap[Number(cid)] || cid;
                          }
                        }
                      }
                      return '-';
                    })()}
                  </div>
                  <div className="col-md-4">
                    <b>Bài học:</b> {detailQuestion.lesson_id ? (lessonMap[detailQuestion.lesson_id] || detailQuestion.lesson_id) : '-'}
                  </div>
                  <div className="col-md-4">
                    <b>Loại câu hỏi:</b> {
                      detailQuestion.type === 0 ? 'Một lựa chọn' :
                        detailQuestion.type === 1 ? 'Nhiều lựa chọn' : 'Khác'
                          // detailQuestion.type === 2 ? 'Đúng/Sai' :
                          //   detailQuestion.type === 3 ? 'Điền vào chỗ trống' : 'Khác'
                    }
                  </div>
                </div>
                <div className="mb-3">
                  <b>Đáp án:</b>
                  <ul>
                    {detailQuestion.choices.map((choice, idx) => (
                      <li style={{ color: choice.is_correct ? 'green' : undefined, fontWeight: choice.is_correct ? 'bold' : undefined }}>
                        <MathJaxContext>
                          {String.fromCharCode(65 + idx)}. {renderMathWithText(choice.choice_content ?? "")}
                        </MathJaxContext>
                        {choice.is_correct && <span className="ms-2 badge bg-success">Đúng</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                {detailQuestion.explanation && (
                  <div className="mb-3">
                    <b>Giải thích:</b>
                    <div style={{ background: '#f1f3f4', padding: 10, borderRadius: 6 }}>{detailQuestion.explanation}</div>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default QuestionsList;