import React, { useState, useEffect } from 'react';
import { Container, Button, Modal, Form } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import ContentManagerSidebar from '../../components/layout/ContentManagerSidebar';
import ContentManagerNavbar from '../../components/layout/ContentManagerNavbar';
import ContentManagerFooter from '../../components/layout/ContentManagerFooter';
import chapterService from '../../services/chapterService';
import type { Chapter } from '../../types';
import { useLocation, Link as ReactRouterLink } from 'react-router-dom';
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
import { listMenuContentManager } from '../../config';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import { visuallyHidden } from '@mui/utils';

const ChaptersList: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [showModal, setShowModal] = useState(false);
    const [editChapter, setEditChapter] = useState<Chapter | null>(null);
    const subjectUser = Number(localStorage.getItem('subject') ?? '0');
    const [form, setForm] = useState<Omit<Chapter, 'id'>>({
        chapter_name: '',
        chapter_description: '',
        subject: subjectUser,
        chapter_number: 1,
        grade: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId] = useState<number | null>(null);
    const location = useLocation();

    // Snackbar multi-message queue logic
    const [snackbarMessages, setSnackbarMessages] = useState<string[]>([]);
    const [snackbarQueue, setSnackbarQueue] = useState<string[]>([]);
    const [snackbarIndex, setSnackbarIndex] = useState(0);
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // Table sorting and selection state
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<keyof Chapter>('chapter_number');
    const [selected, setSelected] = useState<readonly number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    // Add filter state
    const [filterGrade, setFilterGrade] = useState<'all' | 0 | 1 | 2>('all');
    const [filterSubject, setFilterSubject] = useState<'all' | 0 | 1>('all');
    // Sorting helpers
    function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
        if (b[orderBy] < a[orderBy]) return -1;
        if (b[orderBy] > a[orderBy]) return 1;
        return 0;
    }
    function getComparator<Key extends keyof any>(order: 'asc' | 'desc', orderBy: Key) {
        return order === 'desc'
            ? (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => descendingComparator(a, b, orderBy)
            : (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => -descendingComparator(a, b, orderBy);
    }
    const contentStyle: React.CSSProperties = {
        display: 'block',
        maxWidth: 700,
        overflow: 'hidden',
        whiteSpace: 'nowrap', // Không xuống dòng
        wordBreak: 'break-word',
        textOverflow: 'ellipsis', // Hiển thị dấu ... nếu quá dài
    };

    const headCells = [
        { id: 'chapter_name', numeric: false, disablePadding: false, label: 'Tên chương' },
        { id: 'chapter_description', numeric: false, disablePadding: false, label: 'Mô tả' },
        { id: 'grade', numeric: true, disablePadding: false, label: 'Lớp' },
        { id: 'subject', numeric: false, disablePadding: false, label: 'Môn học' },
        { id: 'chapter_number', numeric: true, disablePadding: false, label: 'Thứ tự' },
        { id: 'id', numeric: true, disablePadding: false, label: 'Hành động' },
    ];

    function EnhancedTableHead(props: any) {
        const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
        const createSortHandler = (property: keyof Chapter) => (event: React.MouseEvent<unknown>) => {
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
                            inputProps={{ 'aria-label': 'select all chapters' }}
                        />
                    </TableCell>
                    <TableCell align="center" style={{ width: 60 }}>STT</TableCell>
                    {headCells.filter(h => h.id !== 'id').map((headCell) => (
                        <TableCell
                            key={headCell.id}
                            align={headCell.numeric ? 'right' : 'left'}
                            padding={headCell.disablePadding ? 'none' : 'normal'}
                            sortDirection={orderBy === headCell.id ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'asc'}
                                onClick={createSortHandler(headCell.id as keyof Chapter)}
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
                    <TableCell align="left">Hành động</TableCell>
                </TableRow>
            </TableHead>
        );
    }

    function EnhancedTableToolbar(props: any) {
        const { numSelected, onSearchChange, searchValue, filterGrade, onFilterGradeChange } = props;
        return (
            <Toolbar
                sx={[
                    { pl: { sm: 2 }, pr: { xs: 1, sm: 1 } },
                    numSelected > 0 && {
                        bgcolor: '#f37021', color: 'white', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                    },
                ]}
            >
                {numSelected > 0 ? (
                    <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
                        {numSelected} đã chọn
                    </Typography>
                ) : (
                    <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
                        Danh Sách Chương
                    </Typography>
                )}
                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
                    <Form.Select
                        size="sm"
                        value={filterGrade}
                        onChange={onFilterGradeChange}
                        style={{ minWidth: 100 }}
                    >
                        <option value="all"> Khối lớp </option>
                        <option value={0}>Lớp 10</option>
                        <option value={1}>Lớp 11</option>
                        <option value={2}>Lớp 12</option>
                    </Form.Select>

                    <div style={{ position: 'relative' }}>
                        <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.5, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchValue}
                            onChange={onSearchChange}
                            style={{ padding: '8px 8px 8px 32px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px', color: 'black' }}
                        />
                    </div>
                </div>
            </Toolbar>
        );
    }

    // Selection and sorting handlers
    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelected = chapters.map((n: Chapter) => n.id);
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
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }
        setSelected(newSelected);
    };
    const isSelected = (id: number) => selected.indexOf(id) !== -1;
    const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof Chapter) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
        setPage(0);
    };
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    // Add filter handlers
    const handleFilterGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value === 'all' ? 'all' : (Number(e.target.value) as 0 | 1 | 2);
        setFilterGrade(value);
        setPage(0);
    };

    // Filter, sort, and search chapters (frontend)
    const filteredChapters = chapters
        .filter(chap =>
            (filterGrade === 'all' || chap.grade === filterGrade) &&
            (filterSubject === 'all' || chap.subject === filterSubject)
        )
        .filter(chap =>
            (chap.chapter_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (chap.chapter_description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    const sortedChapters = filteredChapters.sort((a, b) => {
        const comparator = getComparator(order, orderBy);
        return comparator(
            { ...a, chapter_name: a.chapter_name || '', chapter_description: a.chapter_description || '' },
            { ...b, chapter_name: b.chapter_name || '', chapter_description: b.chapter_description || '' }
        );
    });
    const paginatedChapters = rowsPerPage === -1 ? sortedChapters : sortedChapters.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    useEffect(() => {
        fetchChapters();
        setPage(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterGrade]);
    const fetchChapters = async () => {
        setIsLoading(true);
        try {
            const { list, total } = await chapterService.getChapters({
                page: 0,
                size: 10000,
                sort: 'id,asc',
                subject: subjectUser,
                grade: filterGrade === 'all' ? undefined : filterGrade, // ← filter by grade
            });
            setChapters(list || []);
            setTotal(total || 0);
        } catch (e) {
            setSnackbarMessages(['Không thể tải danh sách chương!']);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
        } finally {
            setIsLoading(false);
        }
    };
    const handleShowModal = (chapter?: Chapter) => {
        if (chapter) {
            setEditChapter(chapter);
            setForm({
                chapter_name: chapter.chapter_name,
                chapter_description: chapter.chapter_description,
                subject: chapter.subject,
                chapter_number: chapter.chapter_number,
                grade: chapter.grade,
            });
        } else {
            setEditChapter(null);
            setForm({ chapter_name: '', chapter_description: '', subject: subjectUser, chapter_number: 1, grade: 0 });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditChapter(null);
        setForm({ chapter_name: '', chapter_description: '', subject: 1, chapter_number: 1, grade: 0 });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, subject: Number(e.target.value) });
    };

    const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, grade: Number(e.target.value) });
    };
    function extractMessage(responseData: any, defaultMsg: string): string {
        if (!responseData) return defaultMsg;

        // Prefer 'messages' if present, then 'message'
        const msgs = responseData.messages || responseData.message;

        if (Array.isArray(msgs)) return msgs.join(', '); // or '\n' for multi-line
        if (typeof msgs === 'string') return msgs;

        return defaultMsg;
    }

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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let res;
            if (editChapter) {
                // Ensure the payload includes the id field
                res = await chapterService.updateChapter(editChapter.id, {
                    ...form,
                    id: editChapter.id,
                });
                setSnackbarMessages([extractMessage(res, 'Cập nhật chương thành công!')]);
            } else {
                res = await chapterService.addChapter(form);
                setSnackbarMessages([extractMessage(res, 'Thêm chương thành công!')]);
            }

            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
            fetchChapters();
            handleCloseModal();
        } catch (error: any) {
            console.error('❌ API error:', error.response?.data);

            const msg = extractMessage(
                error.response?.data || error.message,
                'Lưu chương thất bại!'
            );

            setSnackbarMessages([msg]);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
        } finally {
            setIsSaving(false);
        }
    };



    function CustomPaginationActions(props: any) {
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
                onPageChange(null, newPage - 1);
            }
        };
        return (
            <Box sx={{ flexShrink: 0, ml: 0, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                <Button size="sm" onClick={handleBackButtonClick} disabled={page === 0} className="pagination-button-outline">{'<<'}</Button>
                {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i} className={page === i ? 'pagination-button-active' : 'pagination-button-outline'} size="sm" onClick={event => handlePageButtonClick(event, i)}>{i + 1}</Button>
                ))}
                <Button size="sm" onClick={handleNextButtonClick} disabled={page >= totalPages - 1} className="pagination-button-outline">{'>>'}</Button>
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
                        onKeyPress={e => {
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
                                <Link component={ReactRouterLink} to="/content-manager/dashboard" color="inherit" underline="hover">Tổng quan</Link> / <Link component={ReactRouterLink} to={location.pathname} color="inherit" underline="hover">{listMenuContentManager.find(item => item.path === location.pathname)?.name || 'Quản lý Chương'}</Link>
                            </Typography>
                            {/* <h4 className="mb-0">Quản lý Chương</h4> */}
                        </div>
                        <Button variant="primary" onClick={() => handleShowModal()} className="flex items-center gap-2">
                            <FaPlus className="me-2" /> Thêm Chương
                        </Button>
                    </div>
                    <TableContainer component={Paper} className="mb-4">
                        <EnhancedTableToolbar
                            numSelected={selected.length}
                            onSearchChange={handleSearchChange}
                            searchValue={searchTerm}
                            filterGrade={filterGrade}
                            onFilterGradeChange={handleFilterGradeChange}
                        />
                        {isLoading ? (
                            <Typography align="center" sx={{ padding: 2 }}>Đang tải...</Typography>
                        ) : (
                            <Table size="small" aria-label="Danh sách chương">
                                <EnhancedTableHead
                                    numSelected={selected.length}
                                    order={order}
                                    orderBy={orderBy}
                                    onSelectAllClick={handleSelectAllClick}
                                    onRequestSort={handleRequestSort}
                                    rowCount={paginatedChapters.length}
                                />
                                <TableBody>
                                    {paginatedChapters.map((chapter, idx) => {
                                        const isItemSelected = isSelected(chapter.id);
                                        const labelId = `enhanced-table-checkbox-${idx}`;
                                        return (
                                            <TableRow
                                                hover
                                                onClick={event => handleClick(event, chapter.id)}
                                                role="checkbox"
                                                aria-checked={isItemSelected}
                                                tabIndex={-1}
                                                key={chapter.id}
                                                selected={isItemSelected}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        color="primary"
                                                        checked={isItemSelected}
                                                        inputProps={{ 'aria-labelledby': labelId }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">{idx + 1 + (rowsPerPage === -1 ? 0 : page * rowsPerPage)}</TableCell>
                                                <TableCell>{chapter.chapter_name}</TableCell>
                                                <TableCell>
                                                    <span title={chapter.chapter_description} style={contentStyle}>
                                                        {chapter.chapter_description ? chapter.chapter_description : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell align="right">{chapter.grade === 0 ? 'Lớp 10' : chapter.grade === 1 ? 'Lớp 11' : chapter.grade === 2 ? 'Lớp 12' : ''}</TableCell>
                                                <TableCell align="left">{chapter.subject === 0 ? 'Toán học' : chapter.subject === 1 ? 'Vật lý' : ''}</TableCell>
                                                <TableCell align="right">{chapter.chapter_number}</TableCell>
                                                <TableCell>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleShowModal(chapter)}
                                                            style={{
                                                                minWidth: 32,
                                                                minHeight: 32,
                                                                padding: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            disabled={deleteId === chapter.id}
                                                            style={{
                                                                minWidth: 32,
                                                                minHeight: 32,
                                                                padding: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {paginatedChapters.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">Không có chương nào</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 20, { label: 'Tất cả', value: -1 }]}
                        component="div"
                        count={sortedChapters.length}
                        rowsPerPage={rowsPerPage === -1 ? sortedChapters.length : rowsPerPage}
                        page={rowsPerPage === -1 ? 0 : page}
                        onPageChange={(_, newPage) => {
                            if (rowsPerPage === -1) {
                                setPage(0);
                            } else {
                                setPage(newPage);
                            }
                        }}
                        onRowsPerPageChange={e => {
                            const value = parseInt(e.target.value, 10);
                            if (value === -1) {
                                setRowsPerPage(sortedChapters.length);
                                setPage(0);
                            } else {
                                setRowsPerPage(value);
                                setPage(0);
                            }
                        }}
                        ActionsComponent={CustomPaginationActions}
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
                </Container>
                <Modal show={showModal} onHide={handleCloseModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editChapter ? 'Chỉnh sửa Chương' : 'Thêm Chương'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên chương</Form.Label>
                                <Form.Control
                                    name="chapter_name"
                                    value={form.chapter_name}
                                    onChange={handleFormChange}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Mô tả</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="chapter_description"
                                    value={form.chapter_description}
                                    onChange={handleFormChange}
                                    rows={3}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Môn học</Form.Label>
                                <Form.Select
                                    name="subject"
                                    value={editChapter ? form.subject : subjectUser}
                                    onChange={editChapter ? handleSubjectChange : undefined}
                                    required
                                    disabled={!!editChapter} // Disable if not editing
                                >
                                    {!editChapter ? (
                                        <>
                                            <option value={0}>Toán hình</option>
                                            <option value={1}>Vật lý</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value={Number(subjectUser)}>
                                                {localStorage.getItem('subject') === '0' ? 'Toán hình' : 'Vật lý'}
                                            </option>
                                        </>
                                    )}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Lớp:</Form.Label>
                                <Form.Select
                                    name="grade"
                                    value={form.grade}
                                    onChange={handleGradeChange}
                                    required
                                    disabled={!!editChapter}
                                >
                                    <option value={0}>Lớp 10</option>
                                    <option value={1}>Lớp 11</option>
                                    <option value={2}>Lớp 12</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Thứ tự</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="chapter_number"
                                    value={form.chapter_number}
                                    onChange={handleFormChange}
                                    min={1}
                                    required
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Hủy
                        </Button>
                        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                            {editChapter ? 'Lưu thay đổi' : 'Thêm mới'}
                        </Button>
                    </Modal.Footer>
                </Modal>
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
            </main>
        </>
    );
};

export default ChaptersList; 