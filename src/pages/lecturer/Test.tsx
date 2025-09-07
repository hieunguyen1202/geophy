import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Container, Button, Form, Spinner } from 'react-bootstrap';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { Typography, Chip, Card, CardContent, Snackbar, Alert as MuiAlert } from '@mui/material';
import { FaPlus, FaGraduationCap, FaBook, FaListUl, FaCheckCircle, FaEye, FaEdit, FaPrint, FaFilePdf } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';
import LecturerSidebar from '../../components/layout/LecturerSidebar';
import LecturerNavbar from '../../components/layout/LecturerNavbar';
import LecturerFooter from '../../components/layout/LecturerFooter';
import testService from '../../services/testService';
import testAssignmentsService from '../../services/testAssignmentsService';
import classService from '../../services/classService';
import { useLocation, Link as ReactRouterLink, useNavigate } from 'react-router-dom';
import Link from '@mui/material/Link';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { format, parse, isValid } from 'date-fns';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { MathJaxContext } from 'better-react-mathjax';
import { renderMathWithText, getStatusText, getStatusColor } from '../../utils';
import type { StudentAssignment } from "../../services/testAssignmentsService";
const PAGE_SIZE = 5;
import { getClassStudents } from '../../services/classService';
interface Student {
    id: number;
    username: string;
    email: string;
    dob?: string;
    grade?: number;  // 0:10, 1:11, 2:12
    gender?: number; // 1: Nam, 0: Nữ
    full_name?: string;
    created_at?: string;
}

const Test: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [tests, setTests] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [createdBy, setCreatedBy] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTestDetail, setSelectedTestDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showQuestionsPreviewModal, setShowQuestionsPreviewModal] = useState(false);
    const [selectedTestForPreview, setSelectedTestForPreview] = useState<any>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [currentTestId, setCurrentTestId] = useState<number | null>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });
    const location = useLocation();
    const navigate = useNavigate();
    const gradeLabels: Record<number, string> = { 0: 'Lớp 10', 1: 'Lớp 11', 2: 'Lớp 12' };

    // Assign modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [studentsTotal, setStudentsTotal] = useState(0);
    const [studentsPage, setStudentsPage] = useState(0);
    const [studentsPageSize] = useState(10);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [assignDeadline, setAssignDeadline] = useState<Date | null>(null);
    const [assignDuration, setAssignDuration] = useState<number>(60);
    const [assignMaxAttempt, setAssignMaxAttempt] = useState<number>(1);
    const [assignTestId, setAssignTestId] = useState<number | null>(null);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    // const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
    const [classGradeFilter, setClassGradeFilter] = useState<string>('');
    const [_classesLoading, setClassesLoading] = useState(false);
    // FE search/filter state
    const [studentSearch, setStudentSearch] = useState('');
    const [studentGradeFilter, setStudentGradeFilter] = useState('');
    const [_studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
    const [classStudentsCache, setClassStudentsCache] = useState<Record<number, number[]>>({});
    const [classStudentCounts, setClassStudentCounts] = useState<Record<number, number>>({});
    const [classRowLoading, setClassRowLoading] = useState<number | null>(null);
    const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
    const [classStudentsView, setClassStudentsView] = useState<Record<number, Student[]>>({});

    // @ts-ignore
    const [assignedStudents, setAssignedStudents] = useState<any[]>([]);

    const [activeStep, setActiveStep] = useState(0);
    const assignedIdSet = useMemo(() => {
        const ids = assignedStudents
            .map(a => a?.student_id)
            .filter((x): x is number => typeof x === 'number');
        return new Set(ids);
    }, [assignedStudents]);
    // PRINT & PDF
    const previewRef = useRef<HTMLDivElement | null>(null);
    const handlePrintPreview = () => {
        if (!selectedTestForPreview || !selectedTestForPreview.questions) {
            showSnackbar('Không tìm thấy nội dung để in', 'error');
            return;
        }

        try {
            const w = window.open('', '_blank', 'width=1024,height=768');
            if (!w) {
                showSnackbar('Trình duyệt chặn cửa sổ in. Vui lòng cho phép popup.', 'warning');
                return;
            }

            // Generate complete HTML content with all questions
            const questionsHtml = selectedTestForPreview.questions.map((question: any, index: number) => `
                <div class="question-card">
                    <div class="question-header">
                        <span class="question-number">Câu ${index + 1}/${selectedTestForPreview.questions.length}</span>
                        <span class="question-type">${question.question_type === 0 ? 'Một lựa chọn' : question.question_type === 1 ? 'Nhiều lựa chọn' : 'Đúng/sai'}</span>
                    </div>
                    <div class="question-content">
                        <strong>Nội dung câu hỏi:</strong>
                        <div class="question-text">${(question.question_content || '').replace(/<[^>]*>/g, '')}</div>
                    </div>
                    ${question.choices && question.choices.length > 0 ? `
                        <div class="choices">
                            <strong>Các lựa chọn:</strong>
                            ${question.choices.map((choice: any, choiceIndex: number) => `
                                <div class="choice">
                                    <span class="choice-label">${String.fromCharCode(65 + choiceIndex)}.</span>
                                    <span class="choice-content">${(choice.content || '').replace(/<[^>]*>/g, '')}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');

            const html = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>${selectedTestForPreview?.title || 'Bài luyện tập'}</title>
                  <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { 
                      font-family: 'Times New Roman', serif; 
                      padding: 20px; 
                      line-height: 1.6;
                      color: #000;
                      background: #fff;
                      font-size: 14px;
                    }
                    .header { 
                      margin-bottom: 30px; 
                      text-align: center;
                      border-bottom: 2px solid #000;
                      padding-bottom: 15px;
                    }
                    .header h1 {
                      font-size: 24px;
                      margin-bottom: 10px;
                      font-weight: bold;
                    }
                    .meta { 
                      color: #333; 
                      font-size: 14px; 
                      margin-top: 8px; 
                    }
                    .question-card { 
                      border: 1px solid #333; 
                      border-radius: 4px; 
                      margin-bottom: 20px; 
                      background: #fff;
                      padding: 15px;
                      break-inside: avoid;
                    }
                    .question-header {
                      margin-bottom: 15px;
                      padding-bottom: 8px;
                      border-bottom: 1px solid #ddd;
                    }
                    .question-number {
                      font-weight: bold;
                      background: #f0f0f0;
                      padding: 4px 8px;
                      border-radius: 4px;
                      margin-right: 10px;
                    }
                    .question-type {
                      font-style: italic;
                      color: #666;
                    }
                    .question-content {
                      margin-bottom: 15px;
                    }
                    .question-text {
                      margin-top: 8px;
                      padding: 10px;
                      background: #f9f9f9;
                      border: 1px solid #ddd;
                      border-radius: 4px;
                    }
                    .choices {
                      margin-top: 15px;
                    }
                    .choice {
                      margin: 8px 0;
                      padding: 8px;
                      background: #f5f5f5;
                      border: 1px solid #ddd;
                      border-radius: 4px;
                      display: flex;
                      align-items: flex-start;
                    }
                    .choice-label {
                      font-weight: bold;
                      margin-right: 10px;
                      min-width: 25px;
                      background: #e0e0e0;
                      text-align: center;
                      border-radius: 50%;
                      width: 25px;
                      height: 25px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 12px;
                    }
                    .choice-content {
                      flex: 1;
                      padding-left: 5px;
                    }
                    .student-info {
                      margin: 20px 0;
                      padding: 15px;
                      border: 2px solid #000;
                      border-radius: 8px;
                      background: #f9f9f9;
                    }
                    .student-row {
                      display: flex;
                      justify-content: space-between;
                      margin-bottom: 10px;
                    }
                    .student-field {
                      flex: 1;
                      margin-right: 20px;
                    }
                    .student-field:last-child {
                      margin-right: 0;
                    }
                    @page { 
                      margin: 15mm; 
                      size: A4;
                    }
                    @media print {
                      body { 
                        font-size: 12pt; 
                        color: #000 !important;
                      }
                      .question-card {
                        border: 1px solid #000 !important;
                        break-inside: avoid;
                        margin-bottom: 15px;
                      }
                      .student-info {
                        border: 2px solid #000 !important;
                        background: #f9f9f9 !important;
                        break-inside: avoid;
                      }
                      * {
                        color: #000 !important;
                        background: transparent !important;
                      }
                      .question-number {
                        background: #f0f0f0 !important;
                      }
                      .question-text {
                        background: #f9f9f9 !important;
                      }
                      .choice {
                        background: #f5f5f5 !important;
                      }
                      .choice-label {
                        background: #e0e0e0 !important;
                      }
                      .student-info {
                        background: #f9f9f9 !important;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>${selectedTestForPreview?.title || 'BÀI LUYỆN TẬP'}</h1>
                    <div class="meta">
                      <strong>Môn học:</strong> ${subjectLabels[selectedTestForPreview?.subject] || 'N/A'} | 
                      <strong>Khối lớp:</strong> ${gradeLabels[selectedTestForPreview?.grade] || 'N/A'} |
                      <strong>Thời gian làm bài:</strong> ${selectedTestForPreview?.duration / 60 || '-'} phút |
                      <strong>Tổng số câu hỏi:</strong> ${selectedTestForPreview?.questions?.length || 0} câu
                    </div>
                    ${selectedTestForPreview?.description ? `<div style="margin-top: 10px; font-style: italic;"><strong>Mô tả:</strong> ${selectedTestForPreview.description}</div>` : ''}
                    
                    <!-- Student Information Section -->
                    <div class="student-info">
                      <div class="student-row">
                        <div class="student-field">
                          <strong>Họ và tên học sinh:</strong> ________________________________
                        </div>
                        <div class="student-field">
                          <strong>Lớp:</strong> _______________
                        </div>
                      </div>
                      <div class="student-row">
                        <div class="student-field">
                          <strong>Ngày làm bài:</strong> ${new Date().toLocaleDateString('vi-VN')}
                        </div>
                        <div class="student-field">
                          <strong>Điểm số:</strong> _______________
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="content">
                    ${questionsHtml}
                  </div>
                </body>
              </html>
            `;

            w.document.open();
            w.document.write(html);
            w.document.close();

            // Wait for content to load then print
            w.onload = () => {
                setTimeout(() => {
                    w.focus();
                    w.print();
                }, 500);
            };

            // Fallback if onload doesn't work
            setTimeout(() => {
                w.focus();
                w.print();
            }, 1000);

        } catch (error) {
            console.error('Print Error:', error);
            showSnackbar('Lỗi khi in: ' + (error instanceof Error ? error.message : 'Không xác định'), 'error');
        }
    };

    const handleExportPdf = async () => {
        if (!selectedTestForPreview || !selectedTestForPreview.questions) {
            showSnackbar('Không tìm thấy nội dung để xuất PDF', 'error');
            return;
        }

        showSnackbar('Đang tạo PDF...', 'info');

        try {
            const { jsPDF } = await import('jspdf');

            // 1) Load Vietnamese TTFs (served by Vite as URLs, then fetched into ArrayBuffer)
            const regularUrl = new URL('../../assets/fonts/NotoSans-Regular.ttf', import.meta.url).href;
            const boldUrl = new URL('../../assets/fonts/NotoSans-Bold.ttf', import.meta.url).href;

            const [regularBuf, boldBuf] = await Promise.all([
                fetch(regularUrl).then(r => r.arrayBuffer()),
                fetch(boldUrl).then(r => r.arrayBuffer())
            ]);

            // 2) Convert ArrayBuffer -> base64 for jsPDF VFS
            const toBase64 = (buf: ArrayBuffer) => {
                let binary = '';
                const bytes = new Uint8Array(buf);
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                return btoa(binary);
            };

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

            // 3) Register fonts in the virtual file system and map them
            // TypeScript doesn't know these methods; ignore types:
            // @ts-ignore
            pdf.addFileToVFS('NotoSans-Regular.ttf', toBase64(regularBuf));
            // @ts-ignore
            pdf.addFileToVFS('NotoSans-Bold.ttf', toBase64(boldBuf));
            // @ts-ignore
            pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
            // @ts-ignore
            pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');

            // Use our Vietnamese-capable font
            pdf.setFont('NotoSans', 'normal');

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const maxWidth = pageWidth - margin * 2;
            let currentY = margin;

            // Helper: text with wrapping and alignment (NO diacritic stripping!)
            const addText = (
                text: string,
                x: number,
                y: number,
                wrapWidth: number,
                fontSize = 12,
                align: 'left' | 'center' | 'right' = 'left',
                fontStyle: 'normal' | 'bold' = 'normal'
            ) => {
                pdf.setFont('NotoSans', fontStyle);
                pdf.setFontSize(fontSize);
                const lines = pdf.splitTextToSize(text, wrapWidth);
                pdf.text(lines, x, y, { align });
                return y + lines.length * fontSize * 0.45;
            };

            const checkNewPage = (requiredHeight: number) => {
                if (currentY + requiredHeight > pageHeight - margin) {
                    pdf.addPage();
                    pdf.setFont('NotoSans', 'normal');
                    currentY = margin;
                }
            };

            // Header
            currentY = addText(selectedTestForPreview.title || 'Bài luyện tập', pageWidth / 2, currentY, maxWidth, 18, 'center', 'bold') + 5;

            // Meta
            const meta = [
                `Môn học: ${subjectLabels[selectedTestForPreview?.subject] ?? 'N/A'}`,
                `Khối lớp: ${gradeLabels[selectedTestForPreview?.grade] ?? 'N/A'}`,
                `Thời gian làm bài: ${selectedTestForPreview && selectedTestForPreview.duration ? Math.floor(selectedTestForPreview.duration / 60) : '-'} phút`,
                `Tổng số câu hỏi: ${selectedTestForPreview?.questions?.length ?? 0} câu`,
            ];
            meta.forEach(line => (currentY = addText(line, pageWidth / 2, currentY, maxWidth, 12, 'center')));

            if (selectedTestForPreview?.description) {
                currentY = addText(`Mô tả: ${selectedTestForPreview.description}`, pageWidth / 2, currentY + 3, maxWidth, 12, 'center') + 5;
            }

            // Student info block
            currentY += 10;
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 10;

            const today = new Date().toLocaleDateString('vi-VN');
            addText('Họ và tên học sinh: ________________________________', margin, currentY, maxWidth / 2 - 5);
            addText('Lớp: _______________', margin, currentY + 10, maxWidth / 2 - 5);
            addText(`Ngày làm bài: ${today}`, pageWidth / 2 + 5, currentY, maxWidth / 2 - 5);
            addText('Điểm số: _______________', pageWidth / 2 + 5, currentY + 10, maxWidth / 2 - 5);

            currentY += 25;
            pdf.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 12;

            // Questions
            const questionTypes: Record<number, string> = {
                0: 'Một lựa chọn',
                1: 'Nhiều lựa chọn',
                2: 'Đúng/Sai',
            };

            selectedTestForPreview.questions.forEach((q: any, idx: number) => {
                checkNewPage(40);

                // Header of question
                const header = `Câu ${idx + 1}/${selectedTestForPreview.questions.length} (${questionTypes[q.question_type] ?? 'Khác'})`;
                currentY = addText(header, margin, currentY, maxWidth, 13, 'left', 'bold') + 3;

                // Content (strip HTML tags)
                if (q.question_content) {
                    const questionText = q.question_content.replace(/<[^>]*>/g, '').trim();
                    currentY = addText(questionText, margin, currentY, maxWidth, 11) + 4;
                }

                // Choices
                if (q.choices?.length) {
                    for (let i = 0; i < q.choices.length; i++) {
                        checkNewPage(10);
                        const label = String.fromCharCode(65 + i);
                        const content = (q.choices[i]?.content || '').replace(/<[^>]*>/g, '').trim();
                        currentY = addText(`${label}. ${content}`, margin + 5, currentY, maxWidth - 10, 11) + 2;
                    }
                }

                currentY += 6;
            });

            // Filename (keep Vietnamese; most OSes handle UTF-8 filenames)
            const fileName = (selectedTestForPreview?.title || 'bài_luyện_tập').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);
            pdf.save(`${fileName}.pdf`);

            showSnackbar('Đã xuất PDF thành công!', 'success');
        } catch (err) {
            console.error('PDF Export Error:', err);
            showSnackbar('Xuất PDF thất bại', 'error');
        }
    };


    // const isAssigned = (id: number) => assignedIdSet.has(id);
    const uniq = (arr: number[]) => Array.from(new Set(arr));
    // when assignments change, preselect those ids
    useEffect(() => {
        const assignedIds = Array.from(assignedIdSet);
        setSelectedStudents(prev => uniq([...prev, ...assignedIds]));
    }, [assignedIdSet]);
    // Auto-select grade/subject from localStorage on mount
    useEffect(() => {
        const savedGrade = localStorage.getItem('selectedGradeTest');
        const savedSubject = localStorage.getItem('selectedSubjectTest');
        if (savedGrade !== null && savedSubject !== null && savedGrade !== '' && savedSubject !== '') {
            setSelectedGrade(savedGrade);
            setSelectedSubject(savedSubject);
            setActiveStep(2);
        }
    }, []);
    useEffect(() => {
        const today = new Date();
        const end = format(today, 'yyyy-MM-dd');
        const start = format(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        setEndDate(end);
        setStartDate(start);
    }, []);
    // Get user role from localStorage
    useEffect(() => {
        const role = localStorage.getItem('role');
        setUserRole(role || '');
    }, []);

    // Check if user can preview questions
    const canPreviewQuestions = useMemo(() => {
        return userRole?.toLowerCase().includes('lecturer') || userRole?.toLowerCase().includes('admin');
    }, [userRole]);

    useEffect(() => {
        if (selectedGrade === '' || selectedSubject === '') return;
        const fetchTests = async () => {
            setLoading(true);
            setError(null);
            try {
                const { list, total } = await testService.getTests({
                    page: page,
                    size: rowsPerPage,
                    title: searchTerm,
                    created_by: createdBy || undefined,
                    start_date: startDate,
                    end_date: endDate,
                    grade: selectedGrade,
                    subject: selectedSubject,
                });
                setTests(Array.isArray(list) ? list : []);
                setTotal(typeof total === 'number' ? total : 0);
                // if (Array.isArray(list) && list.length > 0) {
                //     showSnackbar(`Đã tải ${list.length} bài luyện tập thành công`, 'success');
                // }
            } catch (err: any) {
                const errorMessage = err.message || 'Không thể tải danh sách bài luyện tập';
                setError(errorMessage);
                showSnackbar(errorMessage, 'error');
                if (
                    err?.message?.toLowerCase().includes('token') ||
                    err?.message?.toLowerCase().includes('auth') ||
                    err?.response?.status === 401
                ) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, [page, rowsPerPage, searchTerm, createdBy, startDate, endDate, selectedGrade, selectedSubject, navigate]);

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // 2) Kiểu option
    type CreatorOption = { value: string; label: string };

    // 3) Tạo options từ tests
    const createdByOptions = useMemo<CreatorOption[]>(() => {
        const map = new Map<string, string>();
        tests.forEach((t: any) => {
            if (t?.created_by !== undefined && t?.created_by !== null) {
                const value = String(t.created_by);                 // id hoặc username (value)
                const label = t.created_by_name || value;           // tên hiển thị
                if (!map.has(value)) map.set(value, label);
            }
        });
        return Array.from(map, ([value, label]) => ({ value, label }));
    }, [tests]);

    // Subject and grade label maps
    const subjectLabels: Record<number, string> = { 0: 'Toán học', 1: 'Vật lý' };
    const gradeOptions = Object.entries(gradeLabels);
    const subjectOptions = Object.entries(subjectLabels);

    const handleResetSelection = () => {
        setSelectedGrade('');
        setSelectedSubject('');
        setActiveStep(0);
        setPage(0);
    };

    const handleViewDetail = async (testId: number) => {
        setCurrentTestId(testId);
        setDetailLoading(true);
        try {
            const response = await testService.getTestDetail(testId);
            setSelectedTestDetail(response.data.data);
            setShowDetailModal(true);
            // showSnackbar('Đã tải chi tiết bài luyện tập thành công', 'success');
        } catch (err: any) {
            const errorMessage = err.message || 'Không thể tải chi tiết bài luyện tập';
            setError(errorMessage);
            showSnackbar(errorMessage, 'error');
            if (
                err?.message?.toLowerCase().includes('token') ||
                err?.message?.toLowerCase().includes('auth') ||
                err?.response?.status === 401
            ) {
                navigate('/login');
            }
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTestDetail(null);
        setCurrentTestId(null);
    };

    const handlePreviewQuestions = async (testId: number) => {
        setPreviewLoading(true);
        try {
            const response = await testService.getTestDetail(testId);
            setSelectedTestForPreview(response.data.data);
            setShowQuestionsPreviewModal(true);
            // showSnackbar('Đã tải danh sách câu hỏi thành công', 'success');
        } catch (err: any) {
            const errorMessage = err.message || 'Không thể tải danh sách câu hỏi';
            setError(errorMessage);
            showSnackbar(errorMessage, 'error');
            if (
                err?.message?.toLowerCase().includes('token') ||
                err?.message?.toLowerCase().includes('auth') ||
                err?.response?.status === 401
            ) {
                navigate('/login');
            }
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCloseQuestionsPreviewModal = () => {
        setShowQuestionsPreviewModal(false);
        setSelectedTestForPreview(null);
    };

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };


    const openAssignModal = (testId: number) => {
        handleCloseDetailModal();
        setAssignTestId(testId);
        setShowAssignModal(true);
        setSelectedStudents([]);
        setSelectedClasses([]);
        setAssignDeadline(null);
        setAssignDuration(60);
        setStudentsPage(0);
    };
    const closeAssignModal = () => {
        setShowAssignModal(false);
        setAssignTestId(null);
        setSelectedStudents([]);
        setAssignDeadline(null);
        setAssignDuration(60);
    };
    useEffect(() => {
        if (!showAssignModal) return;

        // Fetch classes for the lecturer
        const fetchClasses = async () => {
            setClassesLoading(true);
            try {
                const lecturerId = localStorage.getItem('userId');
                if (!lecturerId) {
                    showSnackbar('Không tìm thấy ID giảng viên', 'error');
                    return;
                }

                const data = await classService.getClasses({
                    page: 0,
                    size: 50,
                    lecturer_id: lecturerId
                });

                // The API returns data in data.list
                setClasses(Array.isArray(data.list) ? data.list : []);
            } catch (error) {
                console.error('Error fetching classes:', error);
                showSnackbar('Không thể tải danh sách lớp học', 'error');
            } finally {
                setClassesLoading(false);
            }
        };

        fetchClasses();

        // Reset students when modal opens
        setStudents([]);
        setStudentsTotal(0);
    }, [showAssignModal]);
    useEffect(() => {
        if (!showAssignModal || assignTestId === null) return;

        const fetchAssignedStudents = async () => {
            try {
                const assignmentsRes = await testAssignmentsService.getTestAssignments(assignTestId, 0, 100);
                // const assignmentsRes = await testAssignmentsService.getTestAssignments(assignTestId, 1, 100);
                const assignments = assignmentsRes?.data?.list ?? [];
                setAssignedStudents(assignments); // <-- important

                const assignedIds = assignments
                    .map((a: any) => a?.student_id)
                    .filter((x: any) => typeof x === 'number');

                // preselect all assigned ids
                setSelectedStudents(assignedIds);

                // prefill deadline/duration from first assignment (kept from your code)
                if (assignments.length > 0) {
                    const first = assignments[0];
                    const d = new Date(first.deadline);
                    setAssignDeadline(first.deadline && isValid(d) ? d : null);
                    setAssignDuration(first.duration > 0 ? first.duration : 60);
                } else {
                    setAssignDeadline(null);
                    setAssignDuration(60);
                }
            } catch (error) {
                console.error("Error fetching assigned students:", error);
                setAssignedStudents([]);
                setSelectedStudents([]);
                setAssignDeadline(null);
                setAssignDuration(60);
            }
        };

        fetchAssignedStudents();
    }, [showAssignModal, assignTestId]);


    const handleAssign = async () => {
        if (!assignTestId || !assignDeadline || !assignDuration) return;

        const uniqueSelected = Array.from(new Set(selectedStudents));
        if (uniqueSelected.length === 0) return;

        setAssignLoading(true);
        try {
            const assignmentList = uniqueSelected.map(student_id => ({
                student_id,
                deadline: assignDeadline.toISOString(),
                duration: assignDuration * 60,
                max_attempt: assignMaxAttempt,
            }));

            await testService.assignTestToStudents(assignTestId, assignmentList);

            showSnackbar('Giao bài thành công!', 'success');
            closeAssignModal();
            handleViewDetail(assignTestId);
        } catch (err: any) {
            if (err?.response?.data?.messages) {
                showSnackbar(err.response.data.messages[0], 'error');
            } else if (err?.response?.data?.message) {
                showSnackbar(err.response.data.message, 'error');
            } else {
                showSnackbar('Giao bài thất bại', 'error');
            }
        } finally {
            setAssignLoading(false);
        }
    };

    // Filtered students for FE search/filter
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = studentSearch === '' ||
                s.username?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.email?.toLowerCase().includes(studentSearch.toLowerCase());

            const matchesGrade = studentGradeFilter === '' || String(s.grade) === studentGradeFilter;
            return matchesSearch && matchesGrade;
        });
    }, [students, studentSearch, studentGradeFilter]);

    // Paginate filtered students
    const paginatedStudents = useMemo(() => {
        if (!Array.isArray(filteredStudents)) return [];
        const start = studentsPage * studentsPageSize;
        const end = start + studentsPageSize;
        return filteredStudents.slice(start, end);
    }, [filteredStudents, studentsPage, studentsPageSize]);
    // helpers
    const filteredClasses = useMemo(
        () => classes.filter(c => classGradeFilter === '' || String(c.grade) === classGradeFilter),
        [classes, classGradeFilter]
    );
    // header checkbox state
    const allSelectedOnStudentsPage = useMemo(() => {
        if (!Array.isArray(paginatedStudents) || paginatedStudents.length === 0) return false;
        return paginatedStudents.every((s: any) => selectedStudents.includes(s.id));
    }, [paginatedStudents, selectedStudents]);

    const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pageIds = paginatedStudents.map((s: any) => s.id);
        if (e.target.checked) {
            setSelectedStudents(prev => Array.from(new Set([...prev, ...pageIds])));
        } else {
            setSelectedStudents(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const ensureClassStudents = async (classId: number): Promise<number[]> => {
        // return cached
        if (classStudentsCache[classId]) return classStudentsCache[classId];

        setClassRowLoading(classId);
        try {
            // pull as many as you expect; adjust size if needed
            const res = await getClassStudents({ classId, page: 0, size: 1000 });

            const list: Student[] =
                (res?.list as Student[]) ??
                (res?.data?.list as Student[]) ??
                ([] as Student[]);

            const ids = list.map(s => s.id);
            setClassStudentsCache(prev => ({ ...prev, [classId]: ids }));
            setClassStudentCounts(prev => ({ ...prev, [classId]: list.length }));
            setClassStudentsView(prev => ({ ...prev, [classId]: list }));
            return ids;
        } catch (e) {
            showSnackbar('Không thể tải học sinh của lớp', 'error');
            return [];
        } finally {
            setClassRowLoading(null);
        }
    };
    const toggleClass = async (id: number) => {
        const isChecked = selectedClasses.includes(id);

        if (isChecked) {
            // uncheck class → remove its students from selection
            const ids = await ensureClassStudents(id); // cached if fetched before
            setSelectedClasses(prev => prev.filter(x => x !== id));
            setSelectedStudents(prev => prev.filter(studentId => !ids.includes(studentId)));
        } else {
            // check class → add its students (dedup)
            const ids = await ensureClassStudents(id);
            setSelectedClasses(prev => [...prev, id]);
            setSelectedStudents(prev => Array.from(new Set([...prev, ...ids])));
        }
    };
    const toggleAll = async () => {
        if (allSelectedOnPage) {
            // unselect all visible classes + remove their students
            const idsArrays = await Promise.all(filteredClasses.map(c => ensureClassStudents(c.id)));
            const idsToRemove = new Set(idsArrays.flat());
            setSelectedClasses(prev => prev.filter(id => !filteredClasses.some(c => c.id === id)));
            setSelectedStudents(prev => prev.filter(id => !idsToRemove.has(id)));
        } else {
            // select all visible classes + add all their students (dedup)
            const idsArrays = await Promise.all(filteredClasses.map(c => ensureClassStudents(c.id)));
            const idsToAdd = idsArrays.flat();
            setSelectedClasses(prev => Array.from(new Set([...prev, ...filteredClasses.map(c => c.id)])));
            setSelectedStudents(prev => Array.from(new Set([...prev, ...idsToAdd])));
        }
    };


    const allFilteredIds = filteredClasses.map(c => c.id);
    const allSelectedOnPage = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedClasses.includes(id));
    // Update total for pagination
    useEffect(() => {
        setStudentsTotal(filteredStudents.length);
        if (studentsPage > 0 && studentsPage * studentsPageSize >= filteredStudents.length) {
            setStudentsPage(0);
        }
    }, [filteredStudents, studentsPage, studentsPageSize]);
    // Reset page when filter/search changes
    useEffect(() => {
        setStudentsPage(0);
    }, [studentSearch, studentGradeFilter]);

    const handleUpdateTest = (id: string) => {
        navigate(`/lecturer/update-test/${String(id)}`);
    };

    // Debounced search function
    // const debounce = (func: Function, delay: number) => {
    //     let timeoutId: NodeJS.Timeout;
    //     return (...args: any[]) => {
    //         clearTimeout(timeoutId);
    //         timeoutId = setTimeout(() => func(...args), delay);
    //     };
    // };

    // Function to fetch students with search and filter
    const fetchStudents = async () => {
        if (!showAssignModal) return;
        setStudentsLoading(true);
        try {
            const data = await testService.getStudents({
                page: studentsPage,
                size: studentsPageSize,
                // search: studentSearch,
                // grade: studentGradeFilter,
            });
            const list = Array.isArray(data.data?.list) ? data.data.list : (Array.isArray(data.list) ? data.list : []);
            setStudents(list);
            const total = typeof data.data?.total === 'number' ? data.data.total : (typeof data.total === 'number' ? data.total : 0);
            setStudentsTotal(total);
        } catch (error) {
            showSnackbar('Không thể tải danh sách học sinh', 'error');
        } finally {
            setStudentsLoading(false);
        }
    };
    useEffect(() => {
        const fetchTestAssignments = async () => {
            console.log("Fetching test assignments for testId:", currentTestId);
            try {
                console.log("Fetching test assignments for testId:", currentTestId);
                const data = await testAssignmentsService.getTestAssignments(currentTestId || 0, page, rowsPerPage);
                setStudentAssignments(data.data.list);
                console.log("Fetched test assignments:", data.data.list);
            } catch (err) {
                setError("Failed to fetch test assignments.");
                console.error(err);
            }
        };

        if (currentTestId) {
            fetchTestAssignments();
        }
    }, [currentTestId, page, rowsPerPage]);
    // Debounced version of fetchStudents
    // const debouncedFetchStudents = useMemo(() => debounce(fetchStudents, 300), [studentsPage, studentsPageSize, studentSearch, studentGradeFilter, showAssignModal]);

    // New function to fetch students on search button click
    const handleSearchStudents = async () => {
        fetchStudents();
    };

    return (
        <>
            <LecturerSidebar onCollapse={setSidebarCollapsed} />
            <LecturerNavbar collapsed={sidebarCollapsed} />
            <LecturerFooter collapsed={sidebarCollapsed} />
            <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} bg-gray-50 min-h-screen`}>
                <Container fluid className="py-4">
                    <div className="d-flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                                <Link component={ReactRouterLink} to="/lecturer/home" color="inherit" underline="hover">Home</Link> / <Link component={ReactRouterLink} to={location.pathname} color="inherit" underline="hover">Luyện tập</Link>
                            </Typography>
                            <h4 className="mb-0">Quản lý Bài luyện tập</h4>
                        </div>
                        <Button variant="primary" className="flex items-center gap-2" onClick={() => {
                            if (!selectedGrade || !selectedSubject) {
                                showSnackbar('Vui lòng chọn khối lớp và môn học trước khi thêm bài luyện tập', 'warning');
                                return;
                            }
                            navigate('/lecturer/add-test');
                        }}>
                            <FaPlus className="me-2" /> Thêm Bài luyện tập
                        </Button>
                    </div>

                    {/* Compact Step Selection */}
                    <Paper elevation={2} className="mb-4">
                        <CardContent className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Typography variant="body1" className="font-medium text-gray-800">
                                    Lựa chọn bài luyện tập
                                </Typography>
                                {activeStep > 0 && (
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handleResetSelection}
                                        className="px-3 py-1"
                                    >
                                        Đặt lại
                                    </Button>
                                )}
                            </div>

                            <div className="d-flex flex-wrap gap-3 align-items-center">
                                {/* Grade Selection */}
                                <div className="d-flex align-items-center gap-2">
                                    <FaGraduationCap className="text-blue-600" size={16} />
                                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={activeStep > 0}>
                                        <InputLabel id="grade-label">Khối lớp</InputLabel>
                                        <Select
                                            labelId="grade-label"
                                            value={selectedGrade}
                                            label="Khối lớp"
                                            onChange={(event: SelectChangeEvent) => {
                                                setSelectedGrade(event.target.value);
                                                setSelectedSubject('');
                                                setActiveStep(1);
                                                setPage(0);
                                                if (event.target.value) {
                                                    localStorage.setItem('selectedGradeTest', event.target.value);
                                                    showSnackbar(`Đã chọn khối lớp: ${gradeLabels[parseInt(event.target.value)]}`, 'info');
                                                }
                                            }}
                                        >
                                            <MenuItem value=""><em>Chọn khối lớp</em></MenuItem>
                                            {gradeOptions.map(([value, label]) => (
                                                <MenuItem key={value} value={value}>{label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {selectedGrade && <FaCheckCircle className="text-green-600" size={16} />}
                                </div>

                                {/* Arrow */}
                                {selectedGrade && (
                                    <span className="text-gray-400">→</span>
                                )}

                                {/* Subject Selection */}
                                <div className="d-flex align-items-center gap-2">
                                    <FaBook className="text-green-600" size={16} />
                                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={selectedGrade === '' || activeStep !== 1}>
                                        <InputLabel id="subject-label">Môn học</InputLabel>
                                        <Select
                                            labelId="subject-label"
                                            value={selectedSubject}
                                            label="Môn học"
                                            onChange={(event: SelectChangeEvent) => {
                                                setSelectedSubject(event.target.value);
                                                setActiveStep(2);
                                                setPage(0);
                                                if (event.target.value) {
                                                    localStorage.setItem('selectedSubjectTest', event.target.value);
                                                    showSnackbar(`Đã chọn môn học: ${subjectLabels[parseInt(event.target.value)]}`, 'info');
                                                }
                                            }}
                                        >
                                            <MenuItem value=""><em>Chọn môn học</em></MenuItem>
                                            {subjectOptions.map(([value, label]) => (
                                                <MenuItem key={value} value={value}>{label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {selectedSubject && <FaCheckCircle className="text-green-600" size={16} />}
                                </div>

                                {/* Selection Summary */}
                                {selectedGrade && selectedSubject && (
                                    <div className="d-flex gap-2 ms-auto">
                                        <Chip
                                            label={gradeLabels[parseInt(selectedGrade)]}
                                            color="primary"
                                            size="small"
                                        />
                                        <Chip
                                            label={subjectLabels[parseInt(selectedSubject)]}
                                            color="success"
                                            size="small"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Paper>

                    {/* Only show filters and table if both grade and subject are selected */}
                    {activeStep === 2 && selectedGrade !== '' && selectedSubject !== '' && (
                        <>
                            {/* Compact Filter Section */}
                            <Paper elevation={1} className="p-3 mb-4">
                                <div className="d-flex flex-wrap gap-3 align-items-end">
                                    <div style={{ minWidth: '200px' }}>
                                        <Form.Label className="small text-gray-600 mb-1">Tìm kiếm</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Tìm kiếm bài luyện tập..."
                                            value={searchTerm}
                                            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                                            size="sm"
                                        />
                                    </div>
                                    <div style={{ minWidth: '150px' }}>
                                        <Form.Label className="small text-gray-600 mb-1">Người tạo</Form.Label>
                                        <Form.Select
                                            value={createdBy}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                setCreatedBy(e.target.value);
                                                setPage(0);
                                            }}
                                            size="sm"
                                        >
                                            <option value="">Tất cả</option>
                                            {createdByOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                                        <div style={{ minWidth: '140px' }}>
                                            <Form.Label className="small text-gray-600 mb-1">Từ ngày</Form.Label>
                                            <DatePicker
                                                value={startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : null}
                                                onChange={date => {
                                                    setStartDate(date ? format(date, 'yyyy-MM-dd') : '');
                                                    setPage(0);
                                                }}
                                                format="dd/MM/yyyy"
                                                slotProps={{
                                                    textField: {
                                                        size: 'small',
                                                        fullWidth: true,
                                                        variant: 'outlined',
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div style={{ minWidth: '140px' }}>
                                            <Form.Label className="small text-gray-600 mb-1">Đến ngày</Form.Label>
                                            <DatePicker
                                                value={endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : null}
                                                onChange={date => {
                                                    setEndDate(date ? format(date, 'yyyy-MM-dd') : '');
                                                    setPage(0);
                                                }}
                                                format="dd/MM/yyyy"
                                                slotProps={{
                                                    textField: {
                                                        size: 'small',
                                                        fullWidth: true,
                                                        variant: 'outlined',
                                                    }
                                                }}
                                            />
                                        </div>
                                    </LocalizationProvider>
                                </div>
                            </Paper>

                            {loading && (
                                <div className="text-center py-8">
                                    <Spinner animation="border" role="status" className="text-blue-600" />
                                    <Typography variant="body2" className="mt-2 text-gray-600">
                                        Đang tải dữ liệu...
                                    </Typography>
                                </div>
                            )}
                            {/* {error && <Alert variant="danger" className="mb-4">{error}</Alert>} */}

                            <TableContainer component={Paper} className="mb-4 shadow-sm">
                                <Table size="small" aria-label="Danh sách bài luyện tập">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>STT</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Tiêu đề</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Mô tả</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Điểm tối đa</TableCell>
                                            {/* <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Môn học</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Khối lớp</TableCell> */}
                                            <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Ngày tạo</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Hành động</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tests.map((test: any, idx: number) => (
                                            <TableRow key={test.id} hover>
                                                <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                                <TableCell>{test.title}</TableCell>
                                                <TableCell>{test.description ? test.description : '-'}</TableCell>
                                                <TableCell>{test.total_score}</TableCell>
                                                {/* <TableCell>{subjectLabels[test.subject] ?? test.subject}</TableCell>
                                                <TableCell>{gradeLabels[test.grade] ?? test.grade}</TableCell> */}
                                                <TableCell>{
                                                    test.created_at
                                                        ? (() => {
                                                            const date = new Date(test.created_at);
                                                            return isValid(date)
                                                                ? format(date, 'dd/MM/yyyy')
                                                                : '';
                                                        })()
                                                        : ''
                                                }</TableCell>
                                                <TableCell>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleViewDetail(test.id)}
                                                            disabled={detailLoading}
                                                            className="d-flex align-items-center gap-1"
                                                            style={{ minWidth: '32px', minHeight: '32px' }}
                                                            title="Xem chi tiết"
                                                        >
                                                            <FaEye size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={() => handleUpdateTest(test.id)}
                                                            title="Cập nhật bài luyện tập"
                                                            className="ms-1"
                                                        >
                                                            <FaEdit size={14} />
                                                        </Button>
                                                        {canPreviewQuestions && (
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                onClick={() => handlePreviewQuestions(test.id)}
                                                                disabled={previewLoading}
                                                                className="d-flex align-items-center gap-1"
                                                                style={{ minWidth: '32px', minHeight: '32px' }}
                                                                title="Xem trước câu hỏi"
                                                            >
                                                                <FaListUl size={14} />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            onClick={() => openAssignModal(test.id)}
                                                            title="Giao bài cho học sinh"
                                                        >
                                                            <FaGraduationCap size={14} />
                                                        </Button>
                                                        {/* <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => openAssignedStudentsModal(test.id)}
                        title="Xem học sinh đã được giao"
                        className="ms-1"
                    >
                        <FaEye size={14} />
                    </Button> */}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {tests.length === 0 && !loading && (
                                            <TableRow>
                                                <TableCell colSpan={9} align="center" className="py-8">
                                                    <Typography variant="body2" color="textSecondary">
                                                        Không có bài luyện tập nào
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 20]}
                                    component="div"
                                    count={total}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    labelRowsPerPage="Số hàng mỗi trang:"
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
                                />
                            </TableContainer>
                        </>
                    )}

                    {/* Test Detail Modal */}
                    <Modal show={showDetailModal} onHide={handleCloseDetailModal} size="xl" centered>
                        <Modal.Header closeButton className="bg-blue-50 border-b-0">
                            <div className="flex flex-col w-full">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <Typography variant="h5" className="font-bold text-blue-700 mb-0">
                                        {selectedTestDetail?.title}
                                    </Typography>
                                    {/* {typeof selectedTestDetail?.subject !== 'undefined' && (
                                        <Chip
                                            label={subjectLabels[selectedTestDetail.subject]}
                                            color="primary"
                                            size="small"
                                            className="ml-2"
                                        />
                                    )}
                                    {typeof selectedTestDetail?.grade !== 'undefined' && (
                                        <Chip
                                            label={gradeLabels[selectedTestDetail.grade]}
                                            color="success"
                                            size="small"
                                            className="ml-2"
                                        />
                                    )} */}
                                    <Chip
                                        label={getStatusText(selectedTestDetail?.status)}
                                        color={getStatusColor(selectedTestDetail?.status)}
                                        size="small"
                                        className="ml-2"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm">
                                    {selectedTestDetail?.deadline && (
                                        <span>
                                            <strong>Hạn nộp:</strong> {format(new Date(selectedTestDetail.deadline), 'dd/MM/yyyy HH:mm:ss')}
                                        </span>
                                    )}
                                    {selectedTestDetail?.created_at && (
                                        <span>
                                            <strong>Ngày tạo:</strong> {format(new Date(selectedTestDetail.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                        </span>
                                    )}
                                    <span>
                                        <strong>Số câu hỏi:</strong> {selectedTestDetail?.questions?.length || 0}
                                    </span>
                                </div>
                            </div>
                        </Modal.Header>
                        <Modal.Body className="bg-gray-50">
                            {detailLoading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" role="status" />
                                    <p className="mt-2">Đang tải chi tiết...</p>
                                </div>
                            ) : selectedTestDetail ? (
                                <>
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="bg-white rounded shadow-sm p-4">
                                            <h6 className="font-semibold text-blue-700 mb-3">Thông tin bài luyện tập</h6>
                                            <div className="mb-2">
                                                <strong>Mô tả: </strong>
                                                {selectedTestDetail.description ? (
                                                    selectedTestDetail.description
                                                ) : (
                                                    <span className="text-gray-500">Không có</span>
                                                )}
                                            </div>
                                            <div className="mb-2"><strong>Điểm tối đa:</strong> 10</div>
                                            <div className="mb-2">
                                                <strong>Thời gian làm bài:</strong>{' '}
                                                {selectedTestDetail?.duration !== undefined && selectedTestDetail?.duration !== null && selectedTestDetail?.duration !== 0
                                                    ? `${selectedTestDetail.duration / 60} phút`
                                                    : 'Không có'}
                                            </div>
                                            <div className="mb-2"><strong>Người tạo:</strong> {selectedTestDetail.created_by_name ? selectedTestDetail.created_by_name : '-'}</div>
                                        </div>
                                        <div className="bg-white rounded shadow-sm p-4">
                                            <h6 className="font-semibold text-green-700 mb-3">Thông tin giao bài</h6>
                                            <div className="mb-2 mr-2">
                                                <strong>Trạng thái: </strong>
                                                <Chip
                                                    label={getStatusText(selectedTestDetail?.status)}
                                                    color={getStatusColor(selectedTestDetail?.status)}
                                                    size="small"
                                                    className="ml-2"
                                                />
                                            </div>
                                            <div className="mb-2"><strong>Hạn nộp:</strong> {selectedTestDetail.deadline ? format(new Date(selectedTestDetail.deadline), 'dd/MM/yyyy HH:mm:ss') : 'Không thời hạn'}</div>
                                            <div className="mb-2"><strong>Ngày tạo:</strong> {selectedTestDetail.created_at ? format(new Date(selectedTestDetail.created_at), 'dd/MM/yyyy HH:mm:ss') : 'Không có'}</div>
                                            <div className="mb-2"><strong>Số câu hỏi:</strong> {selectedTestDetail.questions?.length || 0}</div>
                                        </div>
                                    </div>
                                    {canPreviewQuestions && selectedTestDetail?.questions && selectedTestDetail.questions.length > 0 && (
                                        <div className="mt-4" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                            <Button
                                                variant="success"
                                                onClick={() => handlePreviewQuestions(currentTestId!)}
                                                disabled={previewLoading || !currentTestId}
                                                className="d-flex align-items-center gap-2"
                                            >
                                                <FaListUl size={16} />
                                                Xem trước danh sách câu hỏi
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => openAssignModal(currentTestId ? currentTestId : selectedTestDetail.id)}
                                                title="Giao bài cho học sinh"
                                                className="d-flex align-items-center"
                                            >
                                                <FaGraduationCap size={14} />
                                                Giao bài cho học sinh
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p>Không có dữ liệu</p>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="bg-blue-50 border-t-0">
                            <Button variant="secondary" onClick={handleCloseDetailModal}>
                                Đóng
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Questions Preview Modal */}
                    <Modal show={showQuestionsPreviewModal} onHide={handleCloseQuestionsPreviewModal} size="xl" centered>
                        <Modal.Header closeButton className="bg-green-50 border-b-0">
                            <div className="flex flex-col w-full">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <Typography variant="h5" className="font-bold text-green-700 mb-0">
                                        Xem trước câu hỏi - {selectedTestForPreview?.title}
                                    </Typography>
                                    {/* {typeof selectedTestForPreview?.subject !== 'undefined' && (
                                        <Chip
                                            label={subjectLabels[selectedTestForPreview.subject]}
                                            color="primary"
                                            size="small"
                                            className="ml-2"
                                        />
                                    )}
                                    {typeof selectedTestForPreview?.grade !== 'undefined' && (
                                        <Chip
                                            label={gradeLabels[selectedTestForPreview.grade]}
                                            color="success"
                                            size="small"
                                            className="ml-2"
                                        />
                                    )} */}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm">
                                    <span>
                                        <strong>Tổng số câu hỏi:</strong> {selectedTestForPreview?.questions?.length || 0}
                                    </span>
                                    <span>
                                        <strong>Điểm tối đa:</strong> 10
                                    </span>
                                    <span>
                                        <strong>Thời gian làm bài:</strong> {selectedTestForPreview?.duration / 60} phút
                                    </span>
                                </div>
                            </div>
                            <div className="ms-auto d-flex gap-2">
                                <Button variant="outline-secondary" size="sm" onClick={handlePrintPreview} title="In">
                                    <FaPrint className="me-1" /> In
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={handleExportPdf} title="Xuất PDF">
                                    <FaFilePdf className="me-1" /> PDF
                                </Button>
                            </div>
                        </Modal.Header>
                        <Modal.Body className="bg-gray-50 p-0">
                            {previewLoading ? (
                                <div className="text-center py-8">
                                    <Spinner animation="border" role="status" className="text-green-600" />
                                    <Typography variant="body2" className="mt-2 text-gray-600">
                                        Đang tải danh sách câu hỏi...
                                    </Typography>
                                </div>
                            ) : selectedTestForPreview?.questions && selectedTestForPreview.questions.length > 0 ? (
                                <div ref={previewRef} className="p-4" id="preview-print-root">
                                    {/* Header in/print */}
                                    <div className="bg-white rounded shadow-sm p-4 mb-4 border">
                                        <h3 className="m-0">{selectedTestForPreview?.title}</h3>
                                        <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                                            <span className="me-3">
                                                <strong>Môn:</strong> {subjectLabels[selectedTestForPreview?.subject] ?? selectedTestForPreview?.subject ?? '-'}
                                            </span>
                                            <span className="me-3">
                                                <strong>Khối:</strong> {gradeLabels[selectedTestForPreview?.grade] ?? selectedTestForPreview?.grade ?? '-'}
                                            </span>
                                            <span className="me-3">
                                                <strong>Thời gian:</strong> {selectedTestForPreview && selectedTestForPreview.duration != null ? Math.floor(selectedTestForPreview.duration / 60) : '-'} phút
                                            </span>
                                            <span>
                                                <strong>Ngày tạo:</strong>{' '}
                                                {selectedTestForPreview?.created_at
                                                    ? format(new Date(selectedTestForPreview.created_at), 'dd/MM/yyyy HH:mm')
                                                    : '-'}
                                            </span>
                                        </div>
                                        {selectedTestForPreview?.description && (
                                            <div className="mt-2" style={{ fontSize: 13 }}>
                                                <strong>Mô tả:</strong> {selectedTestForPreview.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                        {selectedTestForPreview.questions.map((question: any, index: number) => (
                                            <Card key={question.id} className="shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Chip
                                                            label={`Câu ${index + 1}/${selectedTestForPreview.questions.length}`}
                                                            color="primary"
                                                            size="small"
                                                            className="font-semibold"
                                                        />
                                                        {/* <Chip
                                                            label={difficultyLabels[question.difficulty] ? `Độ khó: ${difficultyLabels[question.difficulty]}` : `Độ khó: ${question.difficulty}`}
                                                            color={question.difficulty === 0 ? 'success' : question.difficulty === 1 ? 'warning' : 'error'}
                                                            size="small"
                                                        /> */}
                                                        <Chip
                                                            label={question.question_type === 0 ? 'Một lựa chọn' : question.question_type === 1 ? 'Nhiều lựa chọn' : 'Đúng/sai'}
                                                            color={question.question_type === 0 ? 'info' : question.question_type === 1 ? 'warning' : 'default'}
                                                            size="small"
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">
                                                            Nội dung câu hỏi:
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            className="text-gray-800 bg-white p-3 rounded border"
                                                            component="div"
                                                        >
                                                            <MathJaxContext>
                                                                <div style={{ fontSize: '14px', padding: '5px' }}>
                                                                    {renderMathWithText(question.question_content ?? "")}
                                                                </div>
                                                            </MathJaxContext>
                                                        </Typography>
                                                    </div>

                                                    {/* {question.simulation_data && question.simulation_data !== 'N/A' && (
                                                        <div className="mb-3">
                                                            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">
                                                                Dữ liệu mô phỏng:
                                                            </Typography>
                                                            <Typography variant="body2" className="text-gray-800 bg-blue-50 p-3 rounded border border-blue-200">
                                                                {question.simulation_data}
                                                            </Typography>
                                                        </div>
                                                    )} */}

                                                    {question.choices && question.choices.length > 0 && (
                                                        <div>
                                                            <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">
                                                                Các lựa chọn:
                                                            </Typography>
                                                            <div className="space-y-2">
                                                                {question.choices.map((choice: any, choiceIndex: number) => (
                                                                    <div key={choiceIndex} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                                                                            {String.fromCharCode(65 + choiceIndex)}
                                                                        </div>
                                                                        <Typography variant="body2" className="text-gray-800">
                                                                            <MathJaxContext>
                                                                                <div style={{ fontSize: '14px', padding: '5px' }}>
                                                                                    {renderMathWithText(choice.content ?? "")}
                                                                                    {/* nếu undefined → "" */}
                                                                                </div>
                                                                            </MathJaxContext>
                                                                        </Typography>
                                                                        {/* {choice.is_correct && (
                                                                            <Chip
                                                                                label="Đáp án đúng"
                                                                                color="success"
                                                                                size="small"
                                                                                className="ml-auto"
                                                                            />
                                                                        )} */}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Typography variant="h6" color="textSecondary" className="mb-2">
                                        Không có câu hỏi nào
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Bài luyện tập này chưa có câu hỏi nào được thêm vào.
                                    </Typography>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="bg-green-50 border-t-0">
                            <Button variant="secondary" onClick={handleCloseQuestionsPreviewModal}>
                                Đóng
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Assign Test Modal */}
                    <Modal show={showAssignModal} onHide={closeAssignModal} size="lg" centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Giao bài luyện tập cho học sinh</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div>
                                <Form.Group>
                                    {/* New Class Selection List with Checkboxes */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Chọn khối lớp</Form.Label>
                                        <Form.Select
                                            value={classGradeFilter}
                                            onChange={e => setClassGradeFilter(e.target.value)}
                                            className="mb-2"
                                        >
                                            <option value="">Tất cả khối</option>
                                            {Object.entries(gradeLabels).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </Form.Select>
                                        <Form.Label>Chọn lớp học</Form.Label>
                                        <div
                                            style={{
                                                maxHeight: '260px',
                                                overflowY: 'auto',
                                                border: '1px solid #ced4da',
                                                borderRadius: 4
                                            }}
                                        >
                                            <Table component="table" size="small" className="mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ width: 44 }}>
                                                            <Form.Check
                                                                type="checkbox"
                                                                aria-label="Chọn tất cả"
                                                                checked={allSelectedOnPage}
                                                                onChange={toggleAll}
                                                            />
                                                        </th>
                                                        <th>Tên lớp</th>
                                                        <th>Khối lớp</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredClasses.map(cls => {
                                                        const checked = selectedClasses.includes(cls.id);
                                                        const count = classStudentCounts[cls.id];

                                                        return (
                                                            <React.Fragment key={cls.id}>
                                                                <tr>
                                                                    <td>
                                                                        <Form.Check
                                                                            type="checkbox"
                                                                            id={`class-checkbox-${cls.id}`}
                                                                            checked={checked}
                                                                            onChange={() => toggleClass(cls.id)}
                                                                            disabled={classRowLoading === cls.id}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <label htmlFor={`class-checkbox-${cls.id}`} className="mb-0">
                                                                            {cls.name}
                                                                        </label>
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            size="sm"
                                                                            className="ms-2"
                                                                            onClick={async () => {
                                                                                await ensureClassStudents(cls.id);
                                                                                setExpandedClassId(expandedClassId === cls.id ? null : cls.id);
                                                                            }}
                                                                        >
                                                                            {classRowLoading === cls.id ? 'Đang tải...' : (expandedClassId === cls.id ? 'Ẩn' : 'Xem')}
                                                                        </Button>
                                                                        {typeof count === 'number' && (
                                                                            <span className="ms-2 text-muted small">({count} học sinh)</span>
                                                                        )}
                                                                    </td>
                                                                    <td>{gradeLabels[cls.grade] ?? cls.grade}</td>
                                                                </tr>

                                                                {expandedClassId === cls.id && (
                                                                    <tr>
                                                                        <td colSpan={3} className="bg-light">
                                                                            {classStudentsView[cls.id]?.length ? (
                                                                                <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                                                                                    <ul className="mb-0">
                                                                                        {classStudentsView[cls.id].map(st => (
                                                                                            <li key={st.id} className="d-flex align-items-center justify-content-between py-1">
                                                                                                <span>{st.full_name || st.username} — {st.email}</span>
                                                                                                <Form.Check
                                                                                                    type="checkbox"
                                                                                                    checked={selectedStudents.includes(st.id)}
                                                                                                    onChange={() => {
                                                                                                        setSelectedStudents(prev =>
                                                                                                            prev.includes(st.id)
                                                                                                                ? prev.filter(id => id !== st.id)
                                                                                                                : [...prev, st.id]
                                                                                                        );
                                                                                                    }}
                                                                                                />
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            ) : (
                                                                                <em className="text-muted">Không có học sinh</em>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                    {filteredClasses.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="text-center text-muted py-3">
                                                                Không có lớp phù hợp bộ lọc.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>

                                    </Form.Group>
                                    {/* Student Search and Filter with Search Button */}
                                    <div className="d-flex gap-2 mb-2 align-items-end">
                                        <Form.Control
                                            type="text"
                                            placeholder="Tìm kiếm tên hoặc email..."
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)}
                                            size="sm"
                                            style={{ maxWidth: 220 }}
                                        />
                                        <Form.Select
                                            value={studentGradeFilter}
                                            onChange={e => setStudentGradeFilter(e.target.value)}
                                            size="sm"
                                            style={{ maxWidth: 160 }}
                                        >
                                            <option value="">Tất cả khối lớp</option>
                                            {Object.entries(gradeLabels).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </Form.Select>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => {
                                                setStudentsPage(0);
                                                handleSearchStudents();
                                            }}
                                        >
                                            Tìm kiếm
                                        </Button>
                                    </div>
                                    <Table size="small">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={allSelectedOnStudentsPage}
                                                        onChange={handleSelectAllStudents}
                                                        disabled={studentsLoading}
                                                    />
                                                </th>
                                                <th>Họ tên</th>
                                                <th>Email</th>
                                                <th>Ngày sinh</th>
                                                <th>Khối lớp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentsLoading ? (
                                                <tr><td colSpan={5} className="text-center">Đang tải...</td></tr>
                                            ) : paginatedStudents.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center">Không có học sinh</td></tr>
                                            ) : paginatedStudents.map((student: any) => (
                                                <tr key={student.id}>
                                                    <td>
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={selectedStudents.includes(student.id)}
                                                            onChange={() => {
                                                                setSelectedStudents(prev =>
                                                                    prev.includes(student.id)
                                                                        ? prev.filter(id => id !== student.id)
                                                                        : [...prev, student.id]
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                    <td>{student.username}</td>
                                                    <td>{student.email}</td>
                                                    <td>
                                                        {student.dob && isValid(new Date(student.dob))
                                                            ? format(new Date(student.dob), 'dd/MM/yyyy')
                                                            : ''}
                                                    </td>
                                                    <td>{gradeLabels[student.grade] ?? student.grade}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                        <div>Đã chọn: {selectedStudents.length} học sinh</div>
                                        <div>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                disabled={studentsPage === 0}
                                                onClick={() => setStudentsPage(p => Math.max(0, p - 1))}
                                            >
                                                Trang trước
                                            </Button>
                                            <span className="mx-2">Trang {studentsPage + 1} / {Math.ceil(studentsTotal / studentsPageSize)}</span>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                disabled={(studentsPage + 1) * studentsPageSize >= studentsTotal}
                                                onClick={() => setStudentsPage(p => p + 1)}
                                            >
                                                Trang sau
                                            </Button>
                                        </div>
                                    </div>
                                </Form.Group>
                                <Form.Group className="mt-3">
                                    <Form.Label>Hạn nộp</Form.Label>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                                        <DateTimePicker
                                            value={assignDeadline}
                                            minDate={new Date()}
                                            onChange={date => {
                                                const currentDate = new Date();
                                                // Check if the selected date is before the current date
                                                if (date && date < currentDate) {
                                                    alert("Hạn nộp không được trước ngày hiện tại.");
                                                } else {
                                                    setAssignDeadline(date);
                                                }
                                            }}
                                            format="dd/MM/yyyy HH:mm"
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                    variant: 'outlined',
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Form.Group>
                                <Form.Group className="mt-3">
                                    <Form.Label>Thời gian làm bài (phút)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        value={assignDuration}
                                        onChange={e => setAssignDuration(Number(e.target.value))}
                                    />
                                </Form.Group>
                                <Form.Group className="mt-3">
                                    <Form.Label>Số lần làm tối đa:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        value={assignMaxAttempt}
                                        onChange={e => setAssignMaxAttempt(Number(e.target.value))}
                                    />
                                </Form.Group>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={closeAssignModal}>Hủy</Button>
                            <Button
                                variant="primary"
                                onClick={handleAssign}
                                disabled={selectedStudents.length === 0 || !assignDeadline || !assignDuration || assignLoading}
                            >
                                {assignLoading ? <Spinner size="sm" /> : "Giao bài"}
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* MUI Snackbar for Notifications */}
                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={4000}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        sx={{ top: { xs: 70, sm: 70 } }}
                    >
                        <MuiAlert
                            onClose={handleSnackbarClose}
                            severity={snackbar.severity}
                            variant="standard"
                            sx={{ width: '100%' }}
                        >
                            {snackbar.message}
                        </MuiAlert>
                    </Snackbar>


                </Container>
            </main>
        </>
    );

};

export default Test;
