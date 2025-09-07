import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Container, Button, Form, Modal, ProgressBar } from 'react-bootstrap';
import { Tabs, Tab, Box, Typography, Link, Snackbar, Alert } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { visuallyHidden } from '@mui/utils';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ContentManagerSidebar from '../../components/layout/ContentManagerSidebar';
import ContentManagerNavbar from '../../components/layout/ContentManagerNavbar';
import ContentManagerFooter from '../../components/layout/ContentManagerFooter';
import * as XLSX from 'xlsx'; // Import XLSX
import { FaDownload, FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa'; // Import FaDownload, FaPlus, FaEye
import '../../styles/sidebar.css';
import '../../styles/questionslist.css';
import { useNavigate, useLocation, Link as ReactRouterLink } from 'react-router-dom';
import { listMenuContentManager } from '../../config';
import questionService from '../../services/questionService';
import { Editor } from '@tinymce/tinymce-react';
import chapterService from '../../services/chapterService';
import lessonService from '../../services/lessonService';
import { renderMathWithText } from '../../utils';
import { MathJaxContext } from 'better-react-mathjax';

const contentStyle: React.CSSProperties = {
  display: 'block',
  maxWidth: 350,
  overflow: 'hidden',
  whiteSpace: 'nowrap', // Không xuống dòng
  wordBreak: 'break-word',
  textOverflow: 'ellipsis', // Hiển thị dấu ... nếu quá dài
};
// CSS chèn thêm để các thẻ block hiển thị inline
const inlineBlockStyle = `
  p, tiny-math-block {
    display: inline;
    margin: 0;
    padding: 0;
  }
`;
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Choice {
  choice_content: string;
  is_correct: boolean;
  explanation?: string;  // Add explanation here
}

interface Question {
  id: number;
  question_content: string;
  difficulty: number;
  grade: number;
  subject: number;
  type: number;
  simulation_data: string;
  choices: Choice[];
  isAI?: boolean;
  source?: 'Thủ công' | 'Excel' | 'AI';
  chapter_id?: number | null;
  lesson_id?: number | null;
  cognitiveLevel?: number;
  answer?: string;
  is_simulation: boolean;
}

interface ExcelQuestionRow {
  question_content: string;
  optionA_content?: string;
  optionA_is_correct?: boolean | string;
  optionB_content?: string;
  optionB_is_correct?: boolean | string;
  optionC_content?: string;
  optionC_is_correct?: boolean | string;
  optionD_content?: string;
  optionD_is_correct?: boolean | string;
  difficulty: number;
  grade?: number;
  subject?: number;
  type?: '0' | '1' | '2' | '3';
  explanation?: string;
}

// Add Lesson type
interface Lesson {
  id: number;
  name: string;
  chapter_id: number;
}


function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

// Helper functions for sorting
function descendingComparator(a: Question, b: Question, orderBy: keyof Question): number {
  // Directly access and ensure type safety for specific sortable columns
  if (orderBy === 'question_content') {
    const aValue = a.question_content;
    const bValue = b.question_content;
    if (bValue === undefined) return -1; // null/undefined at end for asc, or beginning for desc
    if (aValue === undefined) return 1;
    return bValue.localeCompare(aValue);

  } else if (orderBy === 'id' || orderBy === 'difficulty' || orderBy === 'grade' || orderBy === 'subject') {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    // These numeric properties are not optional in Question interface but defensive check
    if (bValue === undefined) return -1;
    if (aValue === undefined) return 1;
    return bValue - aValue;
  } else {
    // This case covers 'answers' and any other non-primitive or non-sortable properties.
    return 0;
  }
}

type Order = 'asc' | 'desc';

function getComparator(
  order: Order,
  orderBy: keyof Question,
): (
  a: Question,
  b: Question,
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}



interface EnhancedTableToolbarProps {
  numSelected: number;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  searchValue: string;
  onFilterChange: (column: keyof Question, value: string) => void;
  filters: { [key: string]: string };
  onDeleteSelected: () => void;
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { numSelected, onSearchChange, searchValue, onFilterChange, filters, onDeleteSelected } = props;

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
        {/* Source Filter */}
        <Form.Select
          size="sm"
          style={{ width: '150px' }}
          value={filters.source || ''}
          onChange={(e) => onFilterChange('source', e.target.value)}
        >
          <option value="">Nguồn</option>
          <option value="Thủ công">Thủ công</option>
          <option value="Excel">Excel</option>
          <option value="AI">AI</option>
        </Form.Select>


        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton onClick={onDeleteSelected} color="error">
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
        size="sm"
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
            size="sm"
            onClick={(event) => handlePageButtonClick(event, actualPageNum - 1)}
          >
            {actualPageNum}
          </Button>
        );
      })}
      <Button
        size="sm"
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

const AddQuestion: React.FC = () => {
  const [value, setValue] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addedQuestions, setAddedQuestions] = useState<Question[]>([]);
  const [loadedFromSession, setLoadedFromSession] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Question>({
    id: 0,
    question_content: '',
    difficulty: 0,
    grade: 0,
    subject: 0,
    type: 0,
    simulation_data: '',
    choices: [{ choice_content: '', is_correct: false, explanation: '' }],
    cognitiveLevel: undefined,
    answer: '',
    is_simulation: false,
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate

  // States for table from QuestionsList.tsx
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Question>('id');
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  // 1. Add state for editing question and modal visibility
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);

  // Add state for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Add state for Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessages, setSnackbarMessages] = useState<string[]>([]);
  const [snackbarQueue, setSnackbarQueue] = useState<string[]>([]);
  const [snackbarIndex, setSnackbarIndex] = useState(0);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Add state for delete multiple modal
  const [deleteMultipleModalOpen, setDeleteMultipleModalOpen] = useState(false);

  // Add state for duplicate modal
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateQuestions, setDuplicateQuestions] = useState<Question[]>([]);

  // Add state for error modal
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalData, setErrorModalData] = useState<{ stt: string, message: string }[]>([]);
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

  // Load questions from session storage on component mount
  useEffect(() => {
    try {
      const currentSubject = getInitialSubject();
      const currentGrade = getInitialGrade();
      const storageKey = `addedQuestions_${currentSubject}_${currentGrade}`;

      // Try to load questions for current subject/grade combination
      const storedQuestions = sessionStorage.getItem(storageKey);
      if (storedQuestions) {
        setAddedQuestions(JSON.parse(storedQuestions));
      } else {
        // Fallback: try to load from old storage format
        const oldStoredQuestions = sessionStorage.getItem('addedQuestions');
        if (oldStoredQuestions) {
          const questions = JSON.parse(oldStoredQuestions);
          // Filter questions that match current subject/grade
          const matchingQuestions = questions.filter((q: Question) =>
            q.subject === currentSubject && q.grade === currentGrade
          );
          setAddedQuestions(matchingQuestions);

          // Clean up old storage
          sessionStorage.removeItem('addedQuestions');
        }
      }
    } catch (error) {
      console.error("Failed to load questions from session storage:", error);
    } finally {
      setLoadedFromSession(true);
    }
  }, []);

  // Save questions to session storage whenever addedQuestions changes, but only after loading
  useEffect(() => {
    if (loadedFromSession) {
      try {
        const currentSubject = getInitialSubject();
        const currentGrade = getInitialGrade();
        const storageKey = `addedQuestions_${currentSubject}_${currentGrade}`;

        if (addedQuestions.length > 0) {
          sessionStorage.setItem(storageKey, JSON.stringify(addedQuestions));
        } else {
          // Remove empty storage entries
          sessionStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error("Failed to save questions to session storage:", error);
      }
    }
  }, [addedQuestions, loadedFromSession]);

  // Prevent navigation when there are unsaved questions
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (addedQuestions.length > 0) {
        event.preventDefault();
        event.returnValue = 'Bạn có câu hỏi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [addedQuestions]);

  // Handle browser back/forward navigation prevention
  useEffect(() => {
    if (addedQuestions.length === 0) return;

    const handlePopState = () => {
      if (addedQuestions.length > 0) {
        const confirmLeave = window.confirm('Bạn có câu hỏi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?');
        if (!confirmLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        } else {
          // Clear storage if user confirms
          const currentSubject = getInitialSubject();
          const currentGrade = getInitialGrade();
          const storageKey = `addedQuestions_${currentSubject}_${currentGrade}`;
          sessionStorage.removeItem(storageKey);
        }
      }
    };

    // Add a history entry to catch back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [addedQuestions]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleAddManualQuestion = () => {
    console.log("new ques: ", newQuestion);
    if (!newQuestion.question_content.trim()) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(["Nội dung câu hỏi không được để trống!"]);
      setSnackbarOpen(true);
      return;
    }
    // Validation for single choice (type 1)
    if (Number(newQuestion.type) === 0) {
      if ((newQuestion.type === 0 || newQuestion.type === 1) && newQuestion.choices.length < 2) {
        setSnackbarSeverity('warning');
        setSnackbarMessages(["Câu hỏi một lựa chọn hoặc nhiều lựa chọn phải có ít nhất 2 đáp án!"]);
        setSnackbarOpen(true);
        return;
      }
      const correctCount = newQuestion.choices.filter(ans => ans.is_correct).length;
      if (correctCount < 1) {
        setSnackbarSeverity('warning');
        setSnackbarMessages(["Câu hỏi một lựa chọn phải có ít nhất 1 đáp án đúng!"]);
        setSnackbarOpen(true);
        return;
      }
    }
    // Validation for multiple choice (type 1)
    if (Number(newQuestion.type) === 1) {
      const correctCount = newQuestion.choices.filter(ans => ans.is_correct).length;
      if (correctCount < 2) {
        setSnackbarSeverity('warning');
        setSnackbarMessages(["Câu hỏi nhiều lựa chọn phải có ít nhất 2 đáp án đúng!"]);
        setSnackbarOpen(true);
        return;
      }
    }
    // Validation for empty choice content
    if (newQuestion.type !== 3 && newQuestion.type !== 2 && newQuestion.choices.some(choice => !choice.choice_content || !choice.choice_content.trim())) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(["Không được để trống nội dung đáp án!"]);
      setSnackbarOpen(true);
      return;
    }
    if (!newQuestion.chapter_id) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(["Vui lòng chọn chương !"]);
      setSnackbarOpen(true);
      return;
    }
    if (!newQuestion.lesson_id) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(["Vui lòng chọn bài học !"]);
      setSnackbarOpen(true);
      return;
    }
    try {
      const questionToAdd = {
        ...newQuestion,
        grade: getInitialGrade(),
        subject: getInitialSubject(),
        // For type 2 (Fill in the blank)
        choices: newQuestion.type === 2 ?
          [{
            choice_content: newQuestion.answer || '',
            is_correct: true,
            explanation: newQuestion.choices[0]?.explanation || ''
          }] :
          newQuestion.choices.map(choice =>
            choice.is_correct ?
              { ...choice, explanation: choice.explanation?.trim() ? choice.explanation : '' } :
              { ...choice, explanation: undefined }
          ),
        id: addedQuestions.length > 0 ? Math.max(...addedQuestions.map(q => q.id)) + 1 : 1,
        // created_at: new Date().toISOString().split('T')[0],
        source: 'Thủ công' as 'Thủ công',
        // chapter_id: newQuestion.chapter_id,
        lesson_id: newQuestion.lesson_id,
      };
      setAddedQuestions((prev) => [...prev, questionToAdd]);
      setNewQuestion({
        id: 0,
        question_content: '',
        difficulty: 0,
        grade: 0,
        subject: 0,
        type: 0,
        simulation_data: '',
        choices: [{ choice_content: '', is_correct: false, explanation: '' }],
        cognitiveLevel: undefined,
        answer: '',
        is_simulation: false,
      });
      setSnackbarMessages(["Thêm câu hỏi thành công!"]);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setManualSelectedChapter(null); // Reset chapter selection
      setManualSelectedLesson(null); // Reset lesson selection
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessages(["Thêm câu hỏi thất bại!"]);
      setSnackbarOpen(true);
    }
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowUploadModal(true);
    setUploadProgress(0);
    setUploadStatus('Đang đọc file Excel...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setUploadStatus('Đang xử lý dữ liệu...');
          setUploadProgress(50);

          await new Promise(resolve => setTimeout(resolve, 1000));

          const processedQuestions = (jsonData as ExcelQuestionRow[]).map((row, index: number) => {
            const answers: Choice[] = [];
            for (let i = 0; i < 4; i++) { // Assuming up to 4 options (A, B, C, D)
              const optionChar = String.fromCharCode(65 + i);
              const contentKey = `option${optionChar}_content`;
              const isCorrectKey = `option${optionChar}_is_correct`;
              if (row[contentKey as keyof ExcelQuestionRow]) {
                const isCorrect = row[isCorrectKey as keyof ExcelQuestionRow] === 'TRUE' || row[isCorrectKey as keyof ExcelQuestionRow] === true;
                answers.push(isCorrect
                  ? { choice_content: row[contentKey as keyof ExcelQuestionRow] as string, is_correct: true, explanation: row.explanation?.trim() ? row.explanation : '' }
                  : { choice_content: row[contentKey as keyof ExcelQuestionRow] as string, is_correct: false }
                );
              }
            }

            return {
              id: addedQuestions.length > 0 ? Math.max(...addedQuestions.map(q => q.id)) + 1 + index : 1 + index, // Unique ID generation
              question_content: row.question_content || '',
              difficulty: row.difficulty || 0,
              grade: row.grade || 0,
              subject: row.subject || 0,
              type: row.type ? Number(row.type) : 1,
              simulation_data: '',
              choices: answers.length > 0 ? answers : [{ choice_content: '', is_correct: false }],
              created_at: new Date().toISOString().split('T')[0],
              source: 'Excel' as 'Excel', // Mark as Excel
            };
          });

          // 1. Check for duplicates (by question_content, all option contents, and type)
          const existingQuestionsSet = new Set(
            addedQuestions.map(q =>
              JSON.stringify({
                question_content: q.question_content.trim(),
                type: q.type,
                choices: q.choices.map(c => c.choice_content.trim()).sort(),
              })
            )
          );
          const importedQuestionsSet = new Set<string>();
          const duplicates: Question[] = [];
          const uniqueQuestions: Question[] = [];

          for (const q of processedQuestions) {
            const key = JSON.stringify({
              question_content: q.question_content.trim(),
              type: q.type,
              choices: q.choices.map(c => c.choice_content.trim()).sort(),
            });
            if (existingQuestionsSet.has(key) || importedQuestionsSet.has(key)) {
              duplicates.push(q);
            } else {
              uniqueQuestions.push(q);
              importedQuestionsSet.add(key);
            }
          }

          if (duplicates.length > 0) {
            setDuplicateQuestions(duplicates);
            setDuplicateModalOpen(true);
          }

          // Only add unique questions
          setAddedQuestions((prev) => ([
            ...prev,
            ...uniqueQuestions as Question[], // Ensure type compatibility
          ]));

          setUploadProgress(100);
          setUploadStatus('Hoàn thành!');

          setTimeout(() => {
            setShowUploadModal(false);
            setUploadProgress(0);
            setUploadStatus('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }, 1000);
          console.log("list ques: ", processedQuestions);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          setUploadStatus('Lỗi khi xử lý file Excel');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        setUploadStatus('Lỗi khi đọc file');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setUploadStatus('Lỗi khi đọc file');
    }
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      {
        question_content: 'Nhập nội dung câu hỏi ở đây',
        optionA_content: 'Lựa chọn A',
        optionA_is_correct: true,
        optionB_content: 'Lựa chọn B',
        optionB_is_correct: false,
        optionC_content: 'Lựa chọn C',
        optionC_is_correct: false,
        optionD_content: 'Lựa chọn D',
        optionD_is_correct: false,
        difficulty: '0',
        grade: '0',
        subject: '0',
        type: '1',
        explanation: ''
      },
    ]);

    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'question_template.xlsx');
  };

  const cancelUpload = () => {
    setShowUploadModal(false);
    setUploadProgress(0);
    setUploadStatus('');
    setSelectedFile(null);
  };

  const handleAnswerChange = (index: number, field: keyof Choice, value: string | boolean) => {
    const updatedAnswers = [...newQuestion.choices];
    if (field === 'choice_content') {
      updatedAnswers[index].choice_content = value as string;
    } else if (field === 'is_correct') {
      // Special logic for multiple choice (type 2)
      if (newQuestion.type === 1 && value === false) {
        // Count how many are currently correct
        const correctCount = updatedAnswers.filter(ans => ans.is_correct).length;
        // If only 2 are correct and user tries to uncheck one, prevent
        if (correctCount === 1 && updatedAnswers[index].is_correct) {
          setSnackbarSeverity('warning');
          setSnackbarMessages(["Câu hỏi nhiều lựa chọn phải có ít nhất 2 đáp án đúng!"]);
          setSnackbarOpen(true);
          return;
        }
      }
      updatedAnswers[index].is_correct = value as boolean;
    }
    setNewQuestion({ ...newQuestion, choices: updatedAnswers });
  };

  const handleAddAnswerOption = () => {
    setNewQuestion((prev) => ({
      ...prev,
      choices: [...prev.choices, { choice_content: '', is_correct: false }],
    }));
  };

  const handleRemoveAnswerOption = (index: number) => {
    setNewQuestion((prev) => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index),
    }));
  };

  const handleCancelQuestion = () => {
    setShowCancelModal(true);
  };
  const handleClearQuestion = () => {
    setShowClearModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    // Clear current subject/grade storage
    const currentSubject = getInitialSubject();
    const currentGrade = getInitialGrade();
    const storageKey = `addedQuestions_${currentSubject}_${currentGrade}`;
    sessionStorage.removeItem(storageKey);
    // Also clear old format for compatibility
    sessionStorage.removeItem('addedQuestions');
    setRowsPerPage(5);
    setPage(0);
    navigate('/content-manager/question');
  };
  const confirmClear = () => {
    setShowClearModal(false);
    // Clear current subject/grade storage
    const currentSubject = getInitialSubject();
    const currentGrade = getInitialGrade();
    const storageKey = `addedQuestions_${currentSubject}_${currentGrade}`;
    sessionStorage.removeItem(storageKey);
    setAddedQuestions([]);
    setRowsPerPage(5);
    setPage(0);
    setSnackbarSeverity('success');
    setSnackbarMessages(["Xoá toàn bộ câu hỏi thành công!"]);
    setSnackbarOpen(true);
  };
  // Logic for table from QuestionsList.tsx
  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof Question,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Only select questions visible on the current page
      const newSelected = visibleRows.map((n) => n.id);
      // Merge with already selected IDs from other pages
      setSelected(Array.from(new Set([...selected, ...newSelected])));
      return;
    }
    // Deselect only questions on the current page
    const visibleIds = visibleRows.map((n) => n.id);
    setSelected(selected.filter(id => !visibleIds.includes(id)));
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
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset page when searching
  };

  const handleFilterChange = (column: keyof Question, value: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters, [column]: value };
      if (value === '') {
        delete newFilters[column];
      }
      return newFilters;
    });
    setPage(0); // Reset page when filtering
  };

  // 2. Update handleEdit to open modal and set question
  const handleEdit = (question: Question) => {
    setEditQuestion({ ...question });
    setEditModalOpen(true);
  };

  // 3. Handle changes in edit modal
  const handleEditAnswerChange = (index: number, field: keyof Choice, value: string | boolean) => {
    if (!editQuestion) return;
    const updatedAnswers = [...editQuestion.choices];
    if (field === 'choice_content') {
      updatedAnswers[index].choice_content = value as string;
    } else if (field === 'is_correct') {
      if (editQuestion.type === 0 && value === false) {
        const correctCount = editQuestion.choices.filter(ans => ans.is_correct).length;
        if (correctCount < 1 && updatedAnswers[index].is_correct) {
          setSnackbarSeverity('warning');
          setSnackbarMessages(["Câu hỏi một lựa chọn phải có ít nhất 1 đáp án đúng!"]);
          setSnackbarOpen(true);
          return;
        }
      }
      // Special logic for multiple choice (type 2)
      if (editQuestion.type === 1 && value === false) {
        const correctCount = updatedAnswers.filter(ans => ans.is_correct).length;
        if (correctCount === 2 && updatedAnswers[index].is_correct) {
          setSnackbarSeverity('warning');
          setSnackbarMessages(["Câu hỏi nhiều lựa chọn phải có ít nhất 2 đáp án đúng!"]);
          setSnackbarOpen(true);
          return;
        }
      }
      updatedAnswers[index].is_correct = value as boolean;
    }
    setEditQuestion({ ...editQuestion, choices: updatedAnswers });
  };

  const handleEditAddAnswerOption = () => {
    if (!editQuestion) return;
    setEditQuestion({ ...editQuestion, choices: [...editQuestion.choices, { choice_content: '', is_correct: false }] });
  };

  const handleEditRemoveAnswerOption = (index: number) => {
    if (!editQuestion) return;
    setEditQuestion({ ...editQuestion, choices: editQuestion.choices.filter((_, i) => i !== index) });
  };

  const handleEditQuestionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editQuestion) return;
    setEditQuestion({
      ...editQuestion,
      type: Number(e.target.value) as number,
      choices: [{ choice_content: '', is_correct: false }],
    });
  };

  const handleEditSave = () => {
    if (!editQuestion) return;

    // Validate chapter and lesson selection
    if (!editQuestion.chapter_id) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(['Vui lòng chọn chương!']);
      setSnackbarOpen(true);
      return;
    }
    if (!editQuestion.lesson_id) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(['Vui lòng chọn bài học!']);
      setSnackbarOpen(true);
      return;
    }

    // Kiểm tra số lượng đáp án cho câu hỏi 1 hoặc nhiều lựa chọn
    if ((editQuestion.type === 0 || editQuestion.type === 1) && editQuestion.choices.length < 2) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(["Câu hỏi một lựa chọn hoặc nhiều lựa chọn phải có ít nhất 2 đáp án!"]);
      setSnackbarOpen(true);
      return;
    }

    // Với câu hỏi một lựa chọn, kiểm tra có ít nhất 1 đáp án đúng
    if (editQuestion.type === 0) {
      const correctCount = editQuestion.choices.filter(ans => ans.is_correct).length;
      if (correctCount < 1) {
        setSnackbarSeverity('warning');
        setSnackbarMessages(["Câu hỏi một lựa chọn phải có ít nhất 1 đáp án đúng!"]);
        setSnackbarOpen(true);
        return;
      }
    }

    // Validation for multiple choice (type 1)
    if (editQuestion.type === 1) {
      const correctCount = editQuestion.choices.filter(ans => ans.is_correct).length;
      if (correctCount < 2) {
        setSnackbarSeverity('warning');
        setSnackbarMessages(["Câu hỏi nhiều lựa chọn phải có ít nhất 2 đáp án đúng!"]);
        setSnackbarOpen(true);
        return;
      }
    }
    // Validation for empty choice content in edit
    if (editQuestion.type !== 3 && editQuestion.type !== 2 && editQuestion.choices.some(choice => !choice.choice_content || !choice.choice_content.trim())) {
      setSnackbarSeverity('warning');
      setSnackbarMessages(["Không được để trống nội dung đáp án!"]);
      setSnackbarOpen(true);
      return;
    }
    try {
      const editedQuestion = {
        ...editQuestion,
        choices: editQuestion.choices.map(choice => ({
          ...choice,
          explanation: choice.is_correct ? (choice.explanation?.trim() || '') : undefined
        })),
      };
      setAddedQuestions((prev) => prev.map(q => q.id === editedQuestion.id ? editedQuestion : q));
      setEditModalOpen(false);
      setEditQuestion(null);
      setSnackbarMessages(["Chỉnh sửa câu hỏi thành công!"]);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessages(["Chỉnh sửa câu hỏi thất bại!"]);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditQuestion(null);
  };

  // Handle delete logic
  const handleDelete = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!questionToDelete) return;
    try {
      setAddedQuestions((prev) => prev.filter(q => q.id !== questionToDelete.id));
      setSnackbarMessages(["Xóa câu hỏi thành công!"]);
      setSnackbarSeverity('success');
      setSelected([]);
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessages(["Xóa câu hỏi thất bại!"]);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setQuestionToDelete(null);
  };

  const handleSaveToDatabase = async () => {
    try {
      // Transform the questions into the required format
      const transformedQuestions = addedQuestions.map(q => ({
        question_content: q.question_content,
        difficulty: q.difficulty,
        grade: q.grade,
        subject: q.subject,
        lesson_id: q.lesson_id || 0,
        type: q.type,
        simulation_data: q.simulation_data || "",
        cognitive_level: q.cognitiveLevel || undefined,
        choices: q.choices.map((choice, index) => ({
          choice_id: index,
          choice_content: choice.choice_content,
          is_correct: choice.is_correct,
          explanation: choice.is_correct ? (choice.explanation || '') : undefined
        })),
        // Add answer field for specific question types
        answer: [2, 4, 5].includes(q.type) ? q.answer : undefined,
        is_simulation: q.is_simulation || false,

      }));
      console.log('save questions:', transformedQuestions);
      const response = await questionService.saveQuestions(transformedQuestions);
      if (response && response.message) {
        // Display message from response
        setSnackbarMessages(Array.isArray(response.message) ? response.message : [response.message]);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setSnackbarIndex(0);
        // Clear current subject/grade storage
        const currentSubject = getInitialSubject();
        const currentGrade = getInitialGrade();
        const storageKey = `addedQuestions_${currentSubject}_${currentGrade}`;
        sessionStorage.removeItem(storageKey);
        // Also clear old format for compatibility
        sessionStorage.removeItem('addedQuestions');
        setAddedQuestions([]);
        setRowsPerPage(5);
        setPage(0);
      }
    } catch (error: any) {
      let errorList: { stt: string, message: string }[] = [];
      let messages: string[] = [];

      if (error.response && error.response.data) {
        let data = error.response.data;

        // If data is a string, try to parse as JSON
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            messages = [data];
          }
        }

        if (typeof data === 'object' && data !== null) {
          // Check for nested data structure (data.data.messages)
          if (data.data && Array.isArray(data.data.messages)) {
            messages = data.data.messages;
          }
          // Check for direct messages array
          else if (Array.isArray(data.messages)) {
            messages = data.messages;
          } else if (Array.isArray(data.message)) {
            messages = data.message;
          } else if (typeof data.message === 'string') {
            messages = [data.message];
          }
          // Fallback: check if data itself is an array of messages
          else if (Array.isArray(data)) {
            messages = data;
          }
        }
      }

      console.log('Extracted messages:', messages); // Debug log

      if (messages.length > 0) {
        errorList = messages.map((msg: string) => {
          // Try to extract the index for STT
          // Handles both "Question at index 5: ..." and "Choice at index 0 of question 6: ..."
          let stt = '-';
          let cleanMessage = msg;

          let match = msg.match(/(?:Question at index (\d+))|(?:Choice at index \d+ of question (\d+))/);
          let matchVN = msg.match(/(?:Câu hỏi số (\d+))|(?:Câu hỏi số \d+)/);
          if (match) {
            stt = match[1] || match[2] || '-';
            // Convert to 1-based index for display
            if (stt !== '-') stt = (parseInt(stt, 10) + 1).toString();

            // Extract only the error message part (after the colon)
            const colonIndex = msg.indexOf(': ');
            if (colonIndex !== -1) {
              cleanMessage = msg.substring(colonIndex + 2);
            }
          }
          if (matchVN) {
            stt = matchVN[1];
            // Extract only the error message part (after the colon)
            const colonIndex = msg.indexOf(': ');
            if (colonIndex !== -1) {
              cleanMessage = msg.substring(colonIndex + 2);
            }
          } else {
            // Handle English format: "Question at index X: ..." or "Choice at index X of question Y: ..."
            let matchEN = msg.match(/(?:Question at index (\d+))|(?:Choice at index \d+ of question (\d+))/);
            if (matchEN) {
              stt = matchEN[1] || matchEN[2] || '-';
              // Convert to 1-based index for display
              if (stt !== '-') stt = (parseInt(stt, 10) + 1).toString();

              // Extract only the error message part (after the colon)
              const colonIndex = msg.indexOf(': ');
              if (colonIndex !== -1) {
                cleanMessage = msg.substring(colonIndex + 2);
              }
            }
          }
          return { stt, message: cleanMessage };
        });
      }

      console.log('Error list:', errorList); // Debug log

      if (errorList.length > 0) {
        setErrorModalData(errorList);
        setErrorModalOpen(true);
      } else {
        setSnackbarQueue([error?.message || 'Lỗi không xác định']);
        setSnackbarMessages([error?.message || 'Lỗi không xác định']);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setSnackbarIndex(0);
        console.error('API error:', error);
      }
    }
  };

  const filteredAndSortedRows = useMemo(() => {
    const filtered = addedQuestions.filter((question) => {
      const matchesSearch = searchTerm
        ? question.question_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.id.toString().includes(searchTerm)
        : true;

      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const questionValue = question[key as keyof Question];
        return String(questionValue) === String(value);
      });

      return matchesSearch && matchesFilters;
    });

    return filtered.sort(getComparator(order, orderBy));
  }, [addedQuestions, order, orderBy, searchTerm, filters]);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredAndSortedRows.length) : 0;

  const visibleRows = useMemo(
    () =>
      filteredAndSortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredAndSortedRows, page, rowsPerPage],
  );

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    if (snackbarQueue.length > 0 && snackbarIndex < snackbarQueue.length - 1) {
      setSnackbarIndex(prev => prev + 1);
      setSnackbarMessages([snackbarQueue[snackbarIndex + 1]]);
      setSnackbarOpen(true);
    } else {
      setSnackbarOpen(false);
      setSnackbarQueue([]);
      setSnackbarIndex(0);
      setSnackbarMessages([]);
    }
  };

  // Handler for delete multiple
  const handleDeleteSelected = () => {
    setDeleteMultipleModalOpen(true);
  };
  const handleDeleteMultipleConfirm = () => {
    setAddedQuestions(prev => prev.filter(q => !selected.includes(q.id)));
    setSelected([]);
    setSnackbarMessages(["Đã xóa các câu hỏi đã chọn!"]);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setDeleteMultipleModalOpen(false);
  };
  const handleDeleteMultipleCancel = () => {
    setDeleteMultipleModalOpen(false);
  };

  function stripMediaTags(html: string) {
    return html
      .replace(/<img[^>]*>/gi, '')
      .replace(/<video[\s\S]*?<\/video>/gi, '');
  }

  // Add state for AI question generation
  const [aiNumQuestions, setAiNumQuestions] = useState(3);
  const getInitialSubject = () => {
    const stored = localStorage.getItem('selectedSubject');
    return stored !== null ? Number(stored) : 0;
  };
  const [aiSubject] = useState(getInitialSubject());
  const getInitialGrade = () => {
    const stored = localStorage.getItem('selectedGrade');
    return stored !== null ? Number(stored) : 0;
  };
  const [aiGrade] = useState(getInitialGrade());
  const [aiDifficulty, setAiDifficulty] = useState(1);
  const [aiChapter, setAiChapter] = useState<number | null>(null);
  const [aiLesson, setAiLesson] = useState<number | null>(null);
  const [aiCognitiveLevel, setAiCognitiveLevel] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [] = useState(false);
  const [] = useState(false);
  const [chapterOptions, setChapterOptions] = useState<{ id: number; chapter_name: string }[]>([]);
  const [lessonOptions, setLessonOptions] = useState<Lesson[]>([]);
  const [] = useState(false);
  const allowedCognitiveByDifficulty: Record<number, number[]> = {
    0: [0, 1], // Dễ → Nhận biết, Thông hiểu
    1: [1, 2], // Trung bình → Thông hiểu, Vận dụng
    2: [2],    // Khó → Vận dụng
  };
  const defaultCognitiveByDifficulty: Record<number, number> = {
    0: 0,
    1: 1,
    2: 2,
  };

  const cognitiveLabels: Record<number, string> = {
    0: 'Nhận biết',
    1: 'Thông hiểu',
    2: 'Vận dụng',
  };
  const allowedNow = allowedCognitiveByDifficulty[aiDifficulty];
  useEffect(() => {
    const allowed = allowedCognitiveByDifficulty[aiDifficulty];
    setAiCognitiveLevel(prev =>
      allowed.includes(prev) ? prev : defaultCognitiveByDifficulty[aiDifficulty]
    );
  }, [aiDifficulty]);
  // Fetch chapters when grade or subject changes
  useEffect(() => {
    if (aiGrade !== null && aiSubject !== null) {
      chapterService.getChapters({
        page: 0,
        size: 100,
        sort: 'id,asc',
        subject: aiSubject,
        grade: aiGrade,
      })
        .then((data: any) => {
          setChapterOptions(data.list || []);
        })
        .catch(() => setChapterOptions([]));
      setAiChapter(null); // reset selected chapters
      setLessonOptions([]);
      setAiLesson(null);
    }
  }, [aiGrade, aiSubject]);

  // Fetch lessons when chapters change
  useEffect(() => {
    if (aiChapter !== null && aiSubject !== null && aiGrade !== null) {
      lessonService.getLessons({
        subject: aiSubject,
        grade: aiGrade,
        chapter_id: aiChapter,
        page: 0,
        size: 1000,
        sort: 'id,asc'
      })
        .then((data: any) => {
          const lessons = data.list || [];
          setLessonOptions(lessons.map((l: any) => ({ ...l, chapter_id: l.chapterId ?? l.chapter_id })));
        })
        .catch(() => setLessonOptions([]));
      setAiLesson(null); // reset lesson when chapter changes
    } else {
      setLessonOptions([]);
      setAiLesson(null);
    }
  }, [aiChapter, aiSubject, aiGrade]);


  const handleGenerateAIQuestions = async () => {
    // 1) Validate đầu vào
    if (!aiChapter) {
      setSnackbarMessages(['Vui lòng chọn chương!']);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    if (!aiLesson) {
      setSnackbarMessages(['Vui lòng chọn bài học!']);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    setAiLoading(true);
    try {
      const chaptersArr =
        aiChapter !== null
          ? chapterOptions
            .filter(c => c.id === aiChapter)
            .map(c => ({ id: c.id, name: c.chapter_name }))
          : [];

      const lessonsArr =
        aiLesson !== null
          ? lessonOptions
            .filter(l => l.id === aiLesson)
            .map(l => ({ id: l.id, name: l.name }))
          : [];

      const payload = {
        numberOfQuestions: Number(aiNumQuestions),
        subject: Number(aiSubject),
        grade: Number(aiGrade),
        chapters: chaptersArr,
        lessons: lessonsArr,
        difficulty: Number(aiDifficulty),
        type: aiType,
        cognitiveLevel: aiCognitiveLevel,
      };

      const res = await questionService.generateAIQuestions(payload);

      // 2) Chuẩn hoá response
      const apiMessages: string[] =
        Array.isArray(res?.message)
          ? res.message
          : typeof res?.message === 'string'
            ? [res.message]
            : [];

      const questions: any[] =
        Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

      // 3) Nếu có message từ API, show ra trước (info/warning tuỳ có data hay không)
      if (apiMessages.length > 0) {
        setSnackbarMessages(apiMessages);
        setSnackbarSeverity(questions.length > 0 ? 'info' : 'warning');
        setSnackbarOpen(true);
      }

      // 4) Không có câu hỏi → dừng
      if (!Array.isArray(questions) || questions.length === 0) {
        if (apiMessages.length === 0) {
          // fallback message nếu API không trả message
          setSnackbarMessages(['Không nhận được dữ liệu câu hỏi từ AI!']);
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
        return;
      }

      // 5) Map dữ liệu câu hỏi
      const nextId =
        addedQuestions.length > 0
          ? Math.max(...addedQuestions.map(q => q.id)) + 1
          : 1;

      const aiQuestionsWithId = questions.map((q: any, idx: number) => {
        let chapter_id: number | null = null;
        let lesson_id: number | null = null;

        if (Array.isArray(q.chapters) && q.chapters.length > 0) {
          chapter_id = q.chapters[0]?.id ?? null;
        } else if (aiChapter !== null) {
          chapter_id = aiChapter;
        }

        if (Array.isArray(q.lessons) && q.lessons.length > 0) {
          lesson_id = q.lessons[0]?.id ?? null;
        } else if (aiLesson !== null) {
          lesson_id = aiLesson;
        }

        return {
          ...q,
          id: nextId + idx,
          question_content: q.content,
          type: q.type,
          choices: Array.isArray(q.choices)
            ? q.choices.map((c: any) => ({
              choice_content: c.content,
              is_correct: c.isCorrect,
            }))
            : [],
          isAI: true,
          source: 'AI' as const,
          chapter_id,
          lesson_id,
        };
      });

      // 6) Cập nhật map bài học (đảm bảo hiển thị tên)
      setAllLessonsMap(prev => ({
        ...prev,
        ...Object.fromEntries(
          lessonOptions
            .filter(l => aiLesson !== null && l.id === aiLesson)
            .map(l => [l.id, l.name])
        ),
      }));

      // 7) Thêm câu hỏi + thông báo
      setAddedQuestions(prev => [...prev, ...aiQuestionsWithId]);
      setSnackbarMessages([`Đã tạo ${aiQuestionsWithId.length} câu hỏi bằng AI!`]);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      // Nếu backend trả { message: [...] } trong error.response?.data
      const errMsgArr: string[] =
        Array.isArray(error?.response?.data?.message)
          ? error.response.data.message
          : error?.response?.data?.message
            ? [String(error.response.data.message)]
            : [error?.message || 'Lỗi khi tạo câu hỏi bằng AI!'];

      setSnackbarMessages(errMsgArr);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAiLoading(false);
    }
  };


  const [manualChapterOptions, setManualChapterOptions] = useState<{ id: number; chapter_name: string }[]>([]);
  const [manualLessonOptions, setManualLessonOptions] = useState<{ id: number; name: string }[]>([]);
  const [manualSelectedChapter, setManualSelectedChapter] = useState<number | null>(null);
  const [manualSelectedLesson, setManualSelectedLesson] = useState<number | null>(null);

  useEffect(() => {
    if (aiGrade !== null && aiSubject !== null) {
      chapterService.getChapters({
        page: 0,
        size: 100,
        sort: 'id,asc',
        subject: aiSubject,
        grade: aiGrade,
      })
        .then((data: any) => {
          setManualChapterOptions(data.list || []);
          setManualSelectedChapter(null);
          setManualLessonOptions([]);
          setManualSelectedLesson(null);
        })
        .catch(() => {
          setManualChapterOptions([]);
          setManualLessonOptions([]);
          setManualSelectedChapter(null);
          setManualSelectedLesson(null);
        });
    }
  }, [aiGrade, aiSubject]);

  useEffect(() => {
    if (manualSelectedChapter !== null && aiSubject !== null && aiGrade !== null) {
      lessonService.getLessons({
        subject: aiSubject,
        grade: aiGrade,
        chapter_id: manualSelectedChapter,
        page: 0,
        size: 1000,
        sort: 'id,asc'
      })
        .then((data: any) => {
          const lessons = data.list || [];
          setManualLessonOptions(lessons);
          setManualSelectedLesson(null);
          // Update allLessonsMap with fetched lessons
          setAllLessonsMap((prev: { [id: number]: string }) => ({
            ...prev,
            ...Object.fromEntries((lessons || []).map((l: any) => [l.id, l.name]))
          }));
        })
        .catch(() => {
          setManualLessonOptions([]);
          setManualSelectedLesson(null);
        });
    } else {
      setManualLessonOptions([]);
      setManualSelectedLesson(null);
    }
  }, [manualSelectedChapter, aiSubject, aiGrade]);

  // In the edit modal, after the Form.Select for grade and subject, add useEffect logic to update manualChapterOptions and manualLessonOptions when editQuestion.grade or editQuestion.subject changes.

  // Add this useEffect inside AddQuestion component:
  useEffect(() => {
    if (editModalOpen && editQuestion) {
      // Fetch chapters for the selected grade/subject
      chapterService.getChapters({
        page: 0,
        size: 100,
        sort: 'id,asc',
        subject: editQuestion.subject,
        grade: editQuestion.grade,
      })
        .then((data: any) => {
          setManualChapterOptions(data.list || []);
          // If current chapter_id is not in the new list, reset it and lesson
          if (!data.list?.some((c: any) => c.id === editQuestion.chapter_id)) {
            setEditQuestion(q => q ? { ...q, chapter_id: null, lesson_id: null } : q);
            setManualLessonOptions([]);
          } else if (editQuestion.chapter_id !== null) {
            lessonService.getLessons({
              subject: Number(editQuestion.subject),
              grade: Number(editQuestion.grade),
              chapter_id: Number(editQuestion.chapter_id),
              page: 0,
              size: 1000,
              sort: 'id,asc'
            })
              .then((data: any) => {
                const lessons = data.list || [];
                setManualLessonOptions(lessons);
                // If current lesson_id is not in the new list, reset it
                if (!lessons.some((l: any) => l.id === editQuestion.lesson_id)) {
                  setEditQuestion(q => q ? { ...q, lesson_id: null } : q);
                }
              })
              .catch(() => setManualLessonOptions([]));
          } else {
            setManualLessonOptions([]);
          }
        })
        .catch(() => {
          setManualChapterOptions([]);
          setManualLessonOptions([]);
        });
    }
  }, [editModalOpen, editQuestion?.grade, editQuestion?.subject, editQuestion?.chapter_id]);

  const [allLessonsMap, setAllLessonsMap] = useState<{ [id: number]: string }>({});

  const [aiType, setAiType] = useState<number>(0); // Default to 0 - Một lựa chọn

  // Add state for detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  // const [_questions, setQuestions] = useState<Question[]>([]);

  const handleRowSimulationToggle = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number
  ) => {
    e.stopPropagation();
    const checked = e.target.checked;
    setAddedQuestions(prev =>
      prev.map(q =>
        q.id === id ? { ...q, is_simulation: checked } : q
      )
    );
  };

  interface HeadCell {
    disablePadding: boolean;
    id: keyof Question;
    label: string;
    numeric: boolean;
  }
  const getAiSubject = () => Number(localStorage.getItem('selectedSubject') ?? '0');

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
    {
      id: 'chapter_id' as keyof Question,
      numeric: false, // align left
      disablePadding: false,
      label: 'Chương',
    },
    {
      id: 'lesson_id' as keyof Question,
      numeric: false, // align left
      disablePadding: false,
      label: 'Bài học',
    },
    ...(getAiSubject() === 0
      ? [
        {
          id: 'is_simulation' as keyof Question,
          numeric: false,
          disablePadding: false,
          label: 'Mô phỏng',
        } as HeadCell,
      ]
      : []),
    {
      id: 'source' as keyof Question,
      numeric: false,
      disablePadding: false,
      label: 'Nguồn',
    },
    {
      id: 'id', // Using ID for actions, though not directly sortable by it for display purposes
      numeric: true,
      disablePadding: false,
      label: 'Hành Động',
    },

  ];

  interface EnhancedTableProps {
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Question) => void;
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
    order: Order;
    orderBy: string;
    visibleRows: Question[];
    selected: readonly number[];
  }

  function EnhancedTableHead(props: EnhancedTableProps) {
    const { onSelectAllClick, order, orderBy, onRequestSort, visibleRows, selected } = props;
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
              indeterminate={visibleRows.some(row => selected.includes(row.id)) && !visibleRows.every(row => selected.includes(row.id))}
              checked={visibleRows.length > 0 && visibleRows.every(row => selected.includes(row.id))}
              onChange={onSelectAllClick}
              inputProps={{
                'aria-label': 'select all questions',
              }}
            />
          </TableCell>
          <TableCell align="center" style={{ width: 60 }}>STT</TableCell>
          {headCells.map((headCell) => (
            <TableCell
              key={headCell.id}
              align={['chapter_id', 'lesson_id'].includes(headCell.id as string) ? 'left' : (headCell.numeric ? 'right' : 'left')}
              padding={headCell.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={headCell.id !== 'id' ? createSortHandler(headCell.id as keyof Question) : undefined}
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
        </TableRow>
      </TableHead>
    );
  }
  return (
    <>
      <ContentManagerSidebar onCollapse={setSidebarCollapsed} />
      <ContentManagerNavbar collapsed={sidebarCollapsed} />
      <ContentManagerFooter collapsed={sidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Container fluid>
          <div>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
              <Link component={ReactRouterLink} to="/content-manager/home" color="inherit" underline="hover">Home</Link> / <Link component={ReactRouterLink} to="/content-manager/question" color="inherit" underline="hover">{listMenuContentManager.find(item => item.path === '/content-manager/question')?.name || 'Câu hỏi'}</Link> / <Link component={ReactRouterLink} to={location.pathname} color="inherit" underline="hover">{listMenuContentManager.find(item => item.path === location.pathname)?.name || 'Thêm Câu Hỏi Mới'}</Link>
            </Typography>
            <h4 className="mb-4">Thêm Câu Hỏi Mới</h4>
          </div>

          <div className="bg-white rounded-3 shadow-sm p-4">
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                  <Tab label="Thêm Thủ Công" {...a11yProps(0)} />
                  {/* <Tab label="Nhập từ Excel" {...a11yProps(1)} /> */}
                  <Tab label="Tạo bằng AI" {...a11yProps(2)} />
                </Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                {/* Manual Add Form */}
                <Form>
                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Nội Dung Câu Hỏi</Form.Label>
                        <Editor
                          value={newQuestion.question_content}
                          apiKey="wk5v67fk6x4f5vr0d4lbwmanudtpgsdnk8m1yoftuz9fyoax"
                          init={{
                            height: 400,
                            menubar: true,
                            plugins: [
                              'math', 'advlist', 'anchor', 'autolink', 'charmap', 'code', 'codesample', 'fullscreen',
                              'help', 'image', 'insertdatetime', 'link', 'lists', 'media',
                              'preview', 'searchreplace', 'table', 'visualblocks',
                              'equation-editor', // <-- add this
                            ],
                            toolbar:
                              'math | codesample | undo redo | styles | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | equation-editor', // <-- add this
                            inline: false,
                            extended_valid_elements: 'span[class|style|data-atom-id]', // <-- important for MathLive
                          }}
                          onEditorChange={(content) =>
                            setNewQuestion({ ...newQuestion, question_content: content })
                          }
                        />
                      </Form.Group>

                    </div>
                    <div className="col-md-6">
                      {[0, 1].includes(newQuestion.type) && (
                        <Form.Group className="mb-3">
                          <Form.Label>Các Lựa Chọn Câu Trả Lời</Form.Label>
                          {newQuestion.choices.map((answer, index) => (
                            <div key={index} className="d-flex mb-2 align-items-center">
                              <Form.Control
                                type="text"
                                placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                                value={answer.choice_content}
                                onChange={(e) => handleAnswerChange(index, 'choice_content', e.target.value)}
                                className="me-2"
                              />
                              {newQuestion.type === 0 ? (
                                // Single choice: radio
                                <Form.Check
                                  type="radio"
                                  name="singleChoice"
                                  label="Đúng"
                                  checked={answer.is_correct}
                                  onChange={(_e) => {
                                    const updatedAnswers = newQuestion.choices.map((ans, i) => ({
                                      ...ans,
                                      is_correct: i === index,
                                    }));
                                    setNewQuestion({ ...newQuestion, choices: updatedAnswers });
                                  }}
                                  className="me-2"
                                />
                              ) : (
                                // Multiple choice: checkbox
                                <Form.Check
                                  type="checkbox"
                                  label="Đúng"
                                  checked={answer.is_correct}
                                  onChange={(e) => handleAnswerChange(index, 'is_correct', e.target.checked)}
                                  className="me-2"
                                />
                              )}
                              {newQuestion.choices.length > 1 && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveAnswerOption(index)}
                                >
                                  Xóa
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button variant="outline-primary" size="sm" onClick={handleAddAnswerOption}>
                            <FaPlus />
                          </Button>
                        </Form.Group>
                      )}

                      {newQuestion.type === 3 && (
                        <Form.Group className="mb-3">
                          <Form.Label>Câu Trả Lời Đúng/Sai</Form.Label>
                          <Form.Check
                            type="radio"
                            label="Đúng"
                            name="trueFalseAnswer"
                            checked={newQuestion.choices[0]?.is_correct === true}
                            onChange={() => setNewQuestion({
                              ...newQuestion,
                              choices: [{ choice_content: 'True', is_correct: true }],
                            })}
                            id="trueFalseTrue"
                            className="mb-2"
                          />
                          <Form.Check
                            type="radio"
                            label="Sai"
                            name="trueFalseAnswer"
                            checked={newQuestion.choices[0]?.is_correct === false}
                            onChange={() => setNewQuestion({
                              ...newQuestion,
                              choices: [{ choice_content: 'False', is_correct: false }],
                            })}
                            id="trueFalseFalse"
                          />
                        </Form.Group>
                      )}

                      {newQuestion.type === 2 && (
                        <Form.Group className="mb-3">
                          <Form.Label>Đáp án</Form.Label>
                          <Form.Control
                            type="text"
                            value={newQuestion.answer || ''}
                            onChange={(e) => setNewQuestion({
                              ...newQuestion,
                              answer: e.target.value,
                              choices: [{ choice_content: e.target.value, is_correct: true }]
                            })}
                            placeholder="Nhập đáp án"
                          />
                        </Form.Group>
                      )}

                      {[4, 5].includes(newQuestion.type) && (
                        <Form.Group className="mb-3">
                          <Form.Label>Đáp án mẫu</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={newQuestion.answer || ''}
                            onChange={(e) => setNewQuestion({
                              ...newQuestion,
                              answer: e.target.value,
                              choices: [{ choice_content: e.target.value, is_correct: true }]
                            })}
                            placeholder="Nhập đáp án mẫu"
                          />
                        </Form.Group>
                      )}

                      {newQuestion.choices.some(choice => choice.is_correct) && (
                        <Form.Group className="mb-3">
                          <Form.Label>Giải thích (Explanation)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Nhập giải thích cho đáp án đúng (nếu có)"
                            value={newQuestion.choices.find(c => c.is_correct)?.explanation || ''}
                            onChange={e => {
                              const newChoices = newQuestion.choices.map(choice =>
                                choice.is_correct ? { ...choice, explanation: e.target.value } : choice
                              );
                              setNewQuestion({ ...newQuestion, choices: newChoices });
                            }}
                          />
                        </Form.Group>
                      )}

                      <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Group className="mb-3" style={{ flex: 1 }}>
                          <Form.Label>Loại Câu Hỏi</Form.Label>
                          <Form.Select
                            value={newQuestion.type.toString()}
                            onChange={(e) => setNewQuestion({
                              ...newQuestion,
                              type: Number(e.target.value) as number,
                              choices: [{ choice_content: '', is_correct: false }],
                            })}
                          >
                            <option value="0">Một lựa chọn</option>
                            <option value="1">Nhiều lựa chọn</option>
                            {/* <option value="2">Điền vào chỗ trống</option>
                            <option value="3">Đúng/Sai</option>
                            <option value="4">Mô phỏng</option>
                            <option value="5">Tự luận</option> */}
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3" style={{ flex: 1 }}>
                          <Form.Label>Độ Khó</Form.Label>
                          <Form.Select
                            value={newQuestion.difficulty.toString()}
                            onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: Number(e.target.value) })}
                          >
                            <option value="0">Dễ</option>
                            <option value="1">Trung Bình</option>
                            <option value="2">Khó</option>
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3" style={{ flex: 1 }}>
                          <Form.Label>Mức độ nhận thức</Form.Label>
                          <Form.Select
                            value={newQuestion.cognitiveLevel?.toString() || ''}
                            onChange={(e) => setNewQuestion({ ...newQuestion, cognitiveLevel: e.target.value ? Number(e.target.value) : undefined })}
                          >
                            <option value="">Chọn mức độ</option>
                            <option value="0">Nhận biết</option>
                            <option value="1">Thông hiểu</option>
                            <option value="2">Vận dụng</option>
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Group className="mb-3" style={{ flex: 1 }}>
                          <Form.Label>Khối lớp</Form.Label>
                          <Form.Control
                            type="text"
                            value={gradeMap[aiGrade]}
                            readOnly
                          />
                        </Form.Group>
                        <Form.Group className="mb-3" style={{ flex: 1 }}>
                          <Form.Label>Môn học</Form.Label>
                          <Form.Control
                            type="text"
                            value={subjectMap[aiSubject]}
                            readOnly
                          />
                        </Form.Group>
                      </div>
                      <Form.Group className="mb-3" style={{ flex: 1 }}>
                        <Form.Label>Chương</Form.Label>
                        <Form.Select
                          value={manualSelectedChapter ?? ''}
                          onChange={e => {
                            const chapterId = Number(e.target.value) || null;
                            setManualSelectedChapter(chapterId);
                            setNewQuestion(prev => ({
                              ...prev,
                              chapter_id: chapterId,
                              lesson_id: null, // Reset lesson when chapter changes
                            }));
                          }}
                          disabled={manualChapterOptions.length === 0}
                        >
                          <option value="">Chọn chương</option>
                          {manualChapterOptions.map(chap => (
                            <option key={chap.id} value={chap.id}>{chap.chapter_name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3" style={{ flex: 1 }}>
                        <Form.Label>Bài học</Form.Label>
                        <Form.Select
                          value={manualSelectedLesson ?? ''}
                          onChange={e => {
                            const lessonId = Number(e.target.value) || null;
                            setManualSelectedLesson(lessonId);
                            setNewQuestion(prev => ({
                              ...prev,
                              lesson_id: lessonId,
                            }));
                          }}
                          disabled={manualLessonOptions.length === 0}
                        >
                          <option value="">Chọn bài học</option>
                          {manualLessonOptions.map(les => (
                            <option key={les.id} value={les.id}>{les.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <Button variant="primary" onClick={handleAddManualQuestion}>Thêm Câu Hỏi</Button>
                  </div>
                </Form>
              </CustomTabPanel>
              {/* <CustomTabPanel value={value} index={1}> */}
                {/* Import from Excel content */}
                {/* <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button variant="primary" onClick={handleImportExcel}>Chọn File Excel</Button>
                  <Button
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={handleDownloadTemplate}
                  >
                    <FaDownload className="me-2" />
                    Tải Mẫu Excel
                  </Button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                />
                <Modal show={showUploadModal} onHide={() => cancelUpload()} backdrop="static" keyboard={false}>
                  <Modal.Header closeButton>
                    <Modal.Title>Đang tải lên</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {selectedFile && (
                      <div className="mb-3">
                        <p className="mb-2">
                          <strong>Tên file:</strong> {selectedFile.name}
                        </p>
                        <p className="mb-2">
                          <strong>Kích thước:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    )}
                    <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} variant="primary" />
                    <p className="mt-2 text-center">{uploadStatus}</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => cancelUpload()}>Hủy</Button>
                  </Modal.Footer>
                </Modal>
              </CustomTabPanel> */}
              <CustomTabPanel value={value} index={1}>
                {/* AI Gen content */}
                <Form className="mb-3">
                  <div className="row">
                    <div className="col-md-6">
                      {/* Số lượng câu hỏi */}
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Group className="mb-2" style={{ flex: 1 }}>
                          <Form.Label>Số lượng câu hỏi</Form.Label>
                          <Form.Control type="number" min={1} max={20} value={aiNumQuestions} onChange={e => setAiNumQuestions(Number(e.target.value))} />
                        </Form.Group>
                        <Form.Group className="mb-2" style={{ flex: 1 }}>
                          <Form.Label>Loại câu hỏi</Form.Label>
                          <Form.Select value={aiType} onChange={e => setAiType(Number(e.target.value))}>
                            <option value={0}>Một lựa chọn</option>
                            <option value={1}>Nhiều lựa chọn</option>
                            {/* <option value={2}>Điền vào chỗ trống</option>
                            <option value={3}>Đúng/Sai</option>
                            <option value={4}>Mô phỏng</option>
                            <option value={5}>Tự luận</option> */}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      {/* Môn học & Khối lớp inline */}
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Group className="mb-2" style={{ flex: 1 }}>
                          <Form.Label>Môn học</Form.Label>
                          <Form.Control
                            type="text"
                            value={subjectMap[aiSubject]}
                            readOnly
                          />
                        </Form.Group>
                        <Form.Group className="mb-2" style={{ flex: 1 }}>
                          <Form.Label>Khối lớp</Form.Label>
                          <Form.Control
                            type="text"
                            value={gradeMap[aiGrade]}
                            readOnly
                          />
                        </Form.Group>
                      </div>
                      {/* Độ khó */}
                      <Form.Group className="mb-2">
                        <Form.Label>Độ khó</Form.Label>
                        <Form.Select
                          value={aiDifficulty}
                          onChange={e => {
                            const d = Number(e.target.value);
                            setAiDifficulty(d);
                            // đồng bộ ngay theo default hợp lệ
                            setAiCognitiveLevel(defaultCognitiveByDifficulty[d]);
                          }}
                        >
                          <option value={0}>Dễ</option>
                          <option value={1}>Trung Bình</option>
                          <option value={2}>Khó</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      {/* Chương */}
                      <Form.Group className="mb-2">
                        <Form.Label>Chương</Form.Label>
                        <Form.Select
                          value={aiChapter ?? ''}
                          onChange={e => {
                            const chapterId = e.target.value ? Number(e.target.value) : null;
                            setAiChapter(chapterId);
                            setAiLesson(null); // reset lesson when chapter changes
                          }}
                          style={{ width: '100%' }}
                        >
                          <option value="">Chọn chương</option>
                          {chapterOptions.map(chap => (
                            <option key={chap.id} value={chap.id}>{chap.chapter_name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      {/* Bài học */}
                      <Form.Group className="mb-2">
                        <Form.Label>Bài học</Form.Label>
                        <Form.Select
                          value={aiLesson ?? ''}
                          onChange={e => setAiLesson(e.target.value ? Number(e.target.value) : null)}
                          style={{ width: '100%' }}
                          disabled={!aiChapter}
                        >
                          <option value="">Chọn bài học</option>
                          {lessonOptions.filter(l => l.chapter_id === aiChapter).map(les => (
                            <option key={les.id} value={les.id}>{les.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      {/* Tags */}
                      <Form.Group className="mb-2">
                        <Form.Label>Mức độ tư duy</Form.Label>
                        <Form.Select
                          value={aiCognitiveLevel}
                          onChange={e => {
                            const val = Number(e.target.value);
                            if (allowedNow.includes(val)) setAiCognitiveLevel(val);
                          }}
                        >
                          {[0, 1, 2].map(level => (
                            <option
                              key={level}
                              value={level}
                              disabled={!allowedNow.includes(level)}
                            >
                              {cognitiveLabels[level]}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>
                </Form>
                <Button variant="primary" onClick={handleGenerateAIQuestions} disabled={aiLoading}>
                  {aiLoading ? 'Đang tạo...' : 'Tạo Câu Hỏi bằng AI'}
                </Button>
              </CustomTabPanel>
            </Box>
          </div>

          <h4 className="mt-5 mb-3">Danh Sách Câu Hỏi Đã Thêm</h4>
          <div className="bg-white rounded-3 shadow-sm p-4">
            <Box sx={{ width: '100%' }}>
              <Paper sx={{ width: '100%', mb: 2 }}>
                <EnhancedTableToolbar
                  numSelected={selected.length}
                  onSearchChange={handleSearchChange}
                  searchValue={searchTerm}
                  onFilterChange={handleFilterChange}
                  filters={filters}
                  onDeleteSelected={handleDeleteSelected}
                />
                <TableContainer>
                  <Table
                    sx={{ minWidth: 750 }}
                    aria-labelledby="tableTitle"
                    size={dense ? 'small' : 'medium'}
                  >
                    <EnhancedTableHead
                      order={order}
                      orderBy={orderBy as string}
                      onSelectAllClick={handleSelectAllClick}
                      onRequestSort={handleRequestSort}
                      visibleRows={visibleRows}
                      selected={selected}
                    />
                    <TableBody>
                      {visibleRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} sx={{ textAlign: 'center', py: 3 }}>
                            {searchTerm || Object.keys(filters).length > 0
                              ? 'Không tìm thấy kết quả'
                              : 'Không có dữ liệu để hiển thị'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        visibleRows.map((row, index) => {
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
                                  {/* {row.isAI && (
                                    <span className="badge bg-info ms-2" style={{ fontSize: '0.7em' }}>AI</span>
                                  )} */}
                                </span>
                              </TableCell>
                              <TableCell align="right">
                                <span
                                  className={`badge bg-${Number(row.difficulty) === 0
                                    ? 'success'
                                    : Number(row.difficulty) === 1
                                      ? 'warning'
                                      : 'danger'
                                    }`}
                                >
                                  {difficultyMap[row.difficulty]}
                                </span>
                              </TableCell>
                              <TableCell align="right">{gradeMap[row.grade]}</TableCell>
                              <TableCell align="right">{subjectMap[row.subject]}</TableCell>
                              <TableCell align="left">
                                {manualChapterOptions.find(c => c.id === row.chapter_id)?.chapter_name || '-'}
                              </TableCell>
                              <TableCell align="left">
                                {row.lesson_id ? (allLessonsMap[row.lesson_id] || '-') : '-'}
                              </TableCell>
                              {aiSubject === 0 && (
                                <TableCell align="left">
                                  {row.cognitiveLevel === 2 && aiSubject === 0 ? (
                                    <Tooltip title="Vẽ hình gợi ý giúp học sinh khi làm bài luyện tập" arrow>
                                      <span>
                                        <Checkbox
                                          color="primary"
                                          checked={row.is_simulation}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => handleRowSimulationToggle(e, row.id)}
                                          inputProps={{ 'aria-label': `is_simulation-${row.id}` }}
                                        />
                                      </span>
                                    </Tooltip>
                                  ) : (
                                    <span></span> 
                                  )}
                                </TableCell>
                              )}
                              <TableCell align="left">
                                {row.source === 'AI' && <span className="badge bg-info">AI</span>}
                                {row.source === 'Excel' && <span className="badge bg-success">Excel</span>}
                                {row.source === 'Thủ công' && <span className="badge bg-secondary">Thủ công</span>}
                              </TableCell>
                              <TableCell align="right">
                                <div>
                                  <Button
                                    variant="link"
                                    className="text-info p-0 me-2"
                                    onClick={(e) => { e.stopPropagation(); setDetailQuestion(row); setDetailModalOpen(true); }}
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
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </TableCell>

                            </TableRow>
                          );
                        })
                      )}
                      {emptyRows > 0 && (
                        <TableRow
                          style={{
                            height: (dense ? 33 : 53) * emptyRows,
                          }}
                        >
                          <TableCell colSpan={12} />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50, { label: 'Tất cả', value: -1 }]}
                  component="div"
                  count={filteredAndSortedRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
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
              <div className="mb-4 d-flex justify-content-end align-items-center">
                <Button variant="danger" onClick={handleClearQuestion} disabled={addedQuestions.length === 0}>
                  Xoá hết
                </Button>
                <Button
                  variant="primary"
                  className="ms-2 me-2"
                  onClick={handleSaveToDatabase}
                  disabled={addedQuestions.length === 0}
                >
                  Lưu vào CSDL
                </Button>
                <Button variant="secondary" onClick={handleCancelQuestion}>
                  Huỷ
                </Button>
              </div>
            </Box>
          </div>
        </Container>
      </main>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy bỏ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn hủy bỏ việc thêm câu hỏi? Mọi thay đổi sẽ không được lưu.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Không</Button>
          <Button variant="primary" onClick={confirmCancel}>Có</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xoá hết</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xoá toàn bộ câu hỏi?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>Không</Button>
          <Button variant="primary" onClick={confirmClear}>Có</Button>
        </Modal.Footer>
      </Modal>
      {/* Edit Question Modal */}
      {editModalOpen && (
        <Modal
          show={editModalOpen}
          onHide={handleEditCancel}
          backdrop="static"
          keyboard={false}
          dialogClassName="modal-xl"
          style={{ minWidth: '1000px' }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Chỉnh sửa câu hỏi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editQuestion && (
              <Form>
                <div className="row">
                  <div className="col-md-7">
                    <Form.Group className="mb-3">
                      <Form.Label>Nội Dung Câu Hỏi</Form.Label>
                      <Editor
                        value={editQuestion.question_content}
                        init={{
                          height: 400,
                          menubar: true,
                          plugins: [
                            'math', 'advlist', 'anchor', 'autolink', 'charmap', 'code', 'codesample', 'fullscreen',
                            'help', 'image', 'insertdatetime', 'link', 'lists', 'media',
                            'preview', 'searchreplace', 'table', 'visualblocks',
                            'equation-editor']
                        }}
                        onEditorChange={(content) =>
                          setEditQuestion({ ...editQuestion, question_content: content })
                        }
                      />
                    </Form.Group>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <Form.Group className="mb-3" style={{ flex: 1 }}>
                        <Form.Label>Khối Lớp</Form.Label>
                        <Form.Select
                          value={editQuestion.grade.toString()}
                          onChange={e => setEditQuestion({ ...editQuestion, grade: Number(e.target.value), chapter_id: null, lesson_id: null })}
                        >
                          {Object.entries(gradeMap).map(([key, value]) => (
                            <option key={key} value={key.toString()}>{value}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3" style={{ flex: 1 }}>
                        <Form.Label>Môn Học</Form.Label>
                        <Form.Select
                          value={editQuestion.subject.toString()}
                          onChange={e => setEditQuestion({ ...editQuestion, subject: Number(e.target.value), chapter_id: null, lesson_id: null })}
                        >
                          {Object.entries(subjectMap).map(([key, value]) => (
                            <option key={key} value={key.toString()}>{value}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <div className="col-md-5">
                    {[0, 1].includes(editQuestion.type) && (
                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <Form.Label className="mb-0">Các Lựa Chọn Câu Trả Lời</Form.Label>
                          <Button variant="outline-primary" size="sm" onClick={handleEditAddAnswerOption}>
                            <FaPlus />
                          </Button>
                        </div>
                        {editQuestion.choices.map((answer, index) => (
                          <div key={index} className="d-flex mb-2 align-items-center">
                            <Form.Control
                              type="text"
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                              value={answer.choice_content}
                              onChange={e => handleEditAnswerChange(index, 'choice_content', e.target.value)}
                              className="me-2"
                            />
                            {editQuestion.type === 0 ? (
                              // Single choice: radio
                              <Form.Check
                                type="radio"
                                name="editSingleChoice"
                                label="Đúng"
                                checked={answer.is_correct}
                                onChange={(_e) => {
                                  const updatedAnswers = editQuestion.choices.map((ans, i) => ({
                                    ...ans,
                                    is_correct: i === index,
                                  }));
                                  setEditQuestion({ ...editQuestion, choices: updatedAnswers });
                                }}
                                className="me-2"
                              />
                            ) : (
                              // Multiple choice: checkbox
                              <Form.Check
                                type="checkbox"
                                label="Đúng"
                                checked={answer.is_correct}
                                onChange={e => handleEditAnswerChange(index, 'is_correct', e.target.checked)}
                                className="me-2"
                              />
                            )}
                            {editQuestion.choices.length > 1 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEditRemoveAnswerOption(index)}
                              >
                                Xóa
                              </Button>
                            )}
                            {/* {answer.is_correct && (
                              <Form.Control
                                type="text"
                                placeholder="Giải thích"
                                value={answer.explanation || ''}
                                onChange={e => {
                                  const updatedChoices = [...editQuestion.choices];
                                  updatedChoices[index] = {
                                    ...updatedChoices[index],
                                    explanation: e.target.value
                                  };
                                  setEditQuestion({ ...editQuestion, choices: updatedChoices });
                                }}
                                className="ms-2"
                              />
                            )} */}
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

                    {[4, 5].includes(editQuestion.type) && (
                      <Form.Group className="mb-3">
                        <Form.Label>Đáp án mẫu</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={editQuestion.answer || ''}
                          onChange={(e) => setEditQuestion({
                            ...editQuestion,
                            answer: e.target.value,
                            choices: [{ choice_content: e.target.value, is_correct: true }]
                          })}
                          placeholder="Nhập đáp án mẫu"
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
                          value={editQuestion.choices.find(c => c.is_correct)?.explanation || ''}
                          onChange={e => {
                            const updatedChoices = editQuestion.choices.map(choice =>
                              choice.is_correct ? { ...choice, explanation: e.target.value } : choice
                            );
                            setEditQuestion({ ...editQuestion, choices: updatedChoices });
                          }}
                        />
                      </Form.Group>
                    )}
                    <Form.Group className="mb-3">
                      <Form.Label>Loại Câu Hỏi</Form.Label>
                      <Form.Select
                        value={editQuestion.type.toString()}
                        onChange={handleEditQuestionTypeChange}
                      >
                        <option value="0">Một lựa chọn</option>
                        <option value="1">Nhiều lựa chọn</option>
                        {/* <option value="2">Điền vào chỗ trống</option>
                        <option value="3">Đúng/Sai</option>
                        <option value="4">Mô phỏng</option>
                        <option value="5">Tự luận</option> */}
                      </Form.Select>
                    </Form.Group>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <Form.Group className="mb-3" style={{ flex: 1 }}>
                        <Form.Label>Độ Khó</Form.Label>
                        <Form.Select
                          value={editQuestion.difficulty.toString()}
                          onChange={e => setEditQuestion({ ...editQuestion, difficulty: Number(e.target.value) })}
                        >
                          <option value="0">Dễ</option>
                          <option value="1">Trung Bình</option>
                          <option value="2">Khó</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3" style={{ flex: 1 }}>
                        <Form.Label>Mức độ nhận thức</Form.Label>
                        <Form.Select
                          value={editQuestion.cognitiveLevel?.toString() || ''}
                          onChange={e => setEditQuestion({
                            ...editQuestion,
                            cognitiveLevel: e.target.value ? Number(e.target.value) : undefined
                          })}
                        >
                          <option value="">Chọn mức độ</option>
                          <option value="0">Nhận biết</option>
                          <option value="1">Thông hiểu</option>
                          <option value="2">Vận dụng</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label>Chương</Form.Label>
                      <Form.Select
                        value={editQuestion.chapter_id ?? ''}
                        onChange={e => {
                          const newChapterId = e.target.value ? Number(e.target.value) : null;
                          setEditQuestion({
                            ...editQuestion,
                            chapter_id: newChapterId,
                            lesson_id: null, // reset lesson when chapter changes
                          });
                          if (newChapterId !== null && editQuestion.subject !== null && editQuestion.grade !== null) {
                            lessonService.getLessons({
                              subject: Number(editQuestion.subject),
                              grade: Number(editQuestion.grade),
                              chapter_id: Number(newChapterId),
                              page: 0,
                              size: 1000,
                              sort: 'id,asc'
                            })
                              .then((data: any) => {
                                const lessons = data.list || [];
                                setManualLessonOptions(lessons);
                                setManualSelectedLesson(null);
                                // Update allLessonsMap
                                setAllLessonsMap(prev => ({
                                  ...prev,
                                  ...Object.fromEntries((lessons || []).map((l: any) => [l.id, l.name]))
                                }));
                              })
                              .catch(() => setManualLessonOptions([]));
                          } else {
                            setManualLessonOptions([]);
                          }
                        }}
                        disabled={manualChapterOptions.length === 0}
                      >
                        <option value="">Chọn chương</option>
                        {manualChapterOptions.map(chap => (
                          <option key={chap.id} value={chap.id}>{chap.chapter_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Bài học</Form.Label>
                      <Form.Select
                        value={editQuestion.lesson_id ?? ''}
                        onChange={e => setEditQuestion({ ...editQuestion, lesson_id: e.target.value ? Number(e.target.value) : null })}
                        disabled={manualLessonOptions.length === 0}
                      >
                        <option value="">Chọn bài học</option>
                        {manualLessonOptions.map(les => (
                          <option key={les.id} value={les.id}>{les.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleEditCancel}>Hủy</Button>
            <Button variant="primary" onClick={handleEditSave}>Lưu</Button>
          </Modal.Footer>
        </Modal>
      )}


      {/* Delete Question Modal */}
      {deleteModalOpen && (
        <Modal show={deleteModalOpen} onHide={handleDeleteCancel} backdrop="static" keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa câu hỏi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {(() => {
              if (!questionToDelete) return null;
              const idx = visibleRows.findIndex(q => q.id === questionToDelete.id);
              const stt = idx !== -1 ? idx + 1 + page * rowsPerPage : questionToDelete.id;
              return <>
                Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.<br />
                <strong>STT: {stt}</strong>
              </>;
            })()}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleDeleteCancel}>Hủy</Button>
            <Button variant="primary" onClick={handleDeleteConfirm}>Xóa</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Multiple Modal */}
      {deleteMultipleModalOpen && (
        <Modal show={deleteMultipleModalOpen} onHide={handleDeleteMultipleCancel} backdrop="static" keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa nhiều câu hỏi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xóa tất cả các câu hỏi đã chọn? Hành động này không thể hoàn tác.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleDeleteMultipleCancel}>Hủy</Button>
            <Button variant="primary" onClick={handleDeleteMultipleConfirm}>Xóa</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Duplicate Modal */}
      <Modal show={duplicateModalOpen} onHide={() => setDuplicateModalOpen(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Phát hiện câu hỏi trùng lặp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <p>Các câu hỏi sau đã bị trùng và không được thêm:</p>
            <ul>
              {duplicateQuestions.map((q, idx) => (
                <li key={idx}>
                  <span dangerouslySetInnerHTML={{ __html: q.question_content }} />
                </li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setDuplicateModalOpen(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Modal */}
      <Modal show={errorModalOpen} onHide={() => setErrorModalOpen(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Danh sách câu hỏi lỗi khi lưu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Các câu hỏi sau bị lỗi và không được lưu:</p>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Lý do lỗi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errorModalData && errorModalData.length > 0 ? (
                  errorModalData.map((err, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{err.stt}</TableCell>
                      <TableCell>{err.message}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Không có dữ liệu lỗi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setErrorModalOpen(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      {snackbarMessages.length > 0 && (
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ top: { xs: 70, sm: 70 } }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessages[0]}
          </Alert>
        </Snackbar>
      )}
      {/* Detail Question Modal */}
      <Modal show={detailModalOpen} onHide={() => setDetailModalOpen(false)} dialogClassName="modal-xl" backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết câu hỏi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!detailQuestion ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
              <span>Đang tải...</span>
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
                <div className="col-md-4"><b>Chương:</b> {manualChapterOptions.find(c => c.id === detailQuestion.chapter_id)?.chapter_name || detailQuestion.chapter_id || '-'}</div>
                <div className="col-md-4"><b>Bài học:</b> {detailQuestion.lesson_id ? (allLessonsMap[detailQuestion.lesson_id] || detailQuestion.lesson_id) : '-'}</div>
                <div className="col-md-4"><b>Loại câu hỏi:</b> {
                  detailQuestion.type === 0 ? 'Một lựa chọn' :
                    detailQuestion.type === 1 ? 'Nhiều lựa chọn' : 'Khác'
                  // detailQuestion.type === 2 ? 'Điền vào chỗ trống' :
                  //   detailQuestion.type === 3 ? 'Đúng/Sai' :
                  //     detailQuestion.type === 4 ? 'Mô phỏng' :
                  //       detailQuestion.type === 5 ? 'Tự luận' : 'Khác'
                }</div>
                <div className="col-md-4">
                  <b>Mức độ nhận thức:</b> {
                    detailQuestion.cognitiveLevel === 0 ? 'Nhận biết' :
                      detailQuestion.cognitiveLevel === 1 ? 'Thông hiểu' :
                        detailQuestion.cognitiveLevel === 2 ? 'Vận dụng' : '-'
                  }
                </div>
              </div>
              <div className="mb-3">
                <b>Đáp án:</b>
                {detailQuestion.type === 2 ? (
                  // For Fill in the blank questions, show only the answer field
                  <div className="mt-2">
                    <span className="badge bg-success me-2">Đáp án đúng:</span>
                    <MathJaxContext>
                      {renderMathWithText(detailQuestion.answer ?? "")}
                    </MathJaxContext>
                  </div>
                ) : (
                  // For other question types, show the choices list
                  <ul>
                    {detailQuestion.choices.map((choice, idx) => (
                      <li
                        key={idx}
                        style={{
                          color: choice.is_correct ? 'green' : undefined,
                          fontWeight: choice.is_correct ? 'bold' : undefined
                        }}
                      >
                        <MathJaxContext>
                          {String.fromCharCode(65 + idx)}. {renderMathWithText(choice.choice_content ?? "")}
                        </MathJaxContext>
                        {choice.is_correct && <span className="ms-2 badge bg-success">Đúng</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {detailQuestion.choices.some(c => c.explanation) && (
                <div className="mb-3">
                  <b>Giải thích:</b>
                  <div style={{ background: '#f1f3f4', padding: 10, borderRadius: 6 }}>
                    {detailQuestion.choices.find(c => c.is_correct)?.explanation}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddQuestion;