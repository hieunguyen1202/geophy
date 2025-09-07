import React, { useState, useEffect } from 'react';
import { Container, Button, Modal, Form } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import ContentManagerSidebar from '../../components/layout/ContentManagerSidebar';
import ContentManagerNavbar from '../../components/layout/ContentManagerNavbar';
import ContentManagerFooter from '../../components/layout/ContentManagerFooter';
import tagService from '../../services/tagService';
import type { Tag } from '../../types';
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
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';

const TagsList: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [showModal, setShowModal] = useState(false);
    const [editTag, setEditTag] = useState<Tag | null>(null);
    const [form, setForm] = useState<Omit<Tag, 'tag_id'>>({
        tag_name: '',
        tag_description: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<readonly number[]>([]);

    // Snackbar logic
    const [snackbarMessages, setSnackbarMessages] = useState<string[]>([]);
    const [snackbarQueue, setSnackbarQueue] = useState<string[]>([]);
    const [snackbarIndex, setSnackbarIndex] = useState(0);
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    useEffect(() => {
        if (searchTerm.trim()) {
            // If searching, fetch all tags for client-side filtering and pagination
            fetchAllTagsForSearch();
        } else {
            fetchTags();
        }
        // eslint-disable-next-line
    }, [page, rowsPerPage, searchTerm]);

    const fetchTags = async () => {
        try {
            const { list, total } = await tagService.getTags({ page: page + 1, size: rowsPerPage });
            setTags(list);
            setTotal(total);
        } catch (e) {
            setSnackbarMessages(["Không thể tải danh sách tags!"]);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
        }
    };

    // Fetch all tags for search
    const fetchAllTagsForSearch = async () => {
        try {
            // Fetch all tags (set a large size)
            const { list } = await tagService.getTags({ page: 1, size: 10000 });
            setTags(list);
            setTotal(list.length);
        } catch (e) {
            setSnackbarMessages(["Không thể tải danh sách tags!"]);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
        }
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
    const handleShowModal = (tag?: Tag) => {
        if (tag) {
            setEditTag(tag);
            setForm({
                tag_name: tag.tag_name,
                tag_description: tag.tag_description,
            });
        } else {
            setEditTag(null);
            setForm({ tag_name: '', tag_description: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditTag(null);
        setForm({ tag_name: '', tag_description: '' });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    function extractMessage(responseData: any, defaultMsg: string): string {
        if (!responseData) return defaultMsg;
        const msgs = responseData.messages || responseData.message;
        if (Array.isArray(msgs)) return msgs.join(', ');
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
        // Validate form
        if (!(form.tag_name ?? '').trim()) {
            setSnackbarMessages(['Tên tag không được để trống!']);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
            return;
        }
        setIsSaving(true);
        try {
            let res;
            if (editTag) {
                res = await tagService.updateTag(editTag.tag_id, {
                    tag_name: form.tag_name,
                    tag_description: form.tag_description
                });
                setSnackbarMessages([extractMessage(res, 'Cập nhật tag thành công!')]);
            } else {
                res = await tagService.addTag(form);
                setSnackbarMessages([extractMessage(res, 'Thêm tag thành công!')]);
            }
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
            fetchTags();
            handleCloseModal();
        } catch (error: any) {
            const msg = extractMessage(
                error.response?.data || error.message,
                'Lưu tag thất bại!'
            );
            setSnackbarMessages([msg]);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteId(id);
        try {
            const res = await tagService.deleteTag([id]);
            setSnackbarMessages([extractMessage(res, 'Xóa tag thành công!')]);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
            fetchTags();
        } catch (e: any) {
            let msg = 'Xóa tag thất bại!';
            if (e.response && e.response.data) {
                if (Array.isArray(e.response.data.message)) {
                    msg = e.response.data.message.join(', ');
                } else if (typeof e.response.data.message === 'string') {
                    msg = e.response.data.message;
                } else if (typeof e.response.data === 'string') {
                    msg = e.response.data;
                }
            }
            setSnackbarMessages([msg]);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSnackbarIndex(0);
        } finally {
            setDeleteId(null);
        }
    };

    // Remove searchTerm from filteredTags, just filter if searchTerm exists
    const filteredTags = searchTerm.trim()
        ? tags.filter(
            tag =>
                (tag.tag_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tag.tag_description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        : tags;

    // Only slice for pagination if searching (client-side)
    const pagedTags = searchTerm.trim()
        ? filteredTags.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : filteredTags;

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
                                <Link component={ReactRouterLink} to="/content-manager/home" color="inherit" underline="hover">Home</Link> / <Link component={ReactRouterLink} to={location.pathname} color="inherit" underline="hover">Tags</Link>
                            </Typography>
                            <h4 className="mb-0">Quản lý Tags</h4>
                        </div>
                        <Button variant="primary" onClick={() => handleShowModal()} className="flex items-center gap-2">
                            <FaPlus className="me-2" /> Thêm Tag
                        </Button>
                    </div>
                    <div className="mb-3" style={{ maxWidth: 300 }}>
                        <Form.Control
                            type="text"
                            placeholder="Tìm kiếm tag..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                        />
                    </div>
                    <TableContainer component={Paper} className="mb-4">
                        <Table size="small" aria-label="Danh sách tags">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 'bold', width: 48 }}>
                                        <Checkbox
                                            color="primary"
                                            indeterminate={selected.length > 0 && selected.length < pagedTags.length}
                                            checked={pagedTags.length > 0 && selected.length === pagedTags.length}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setSelected(pagedTags.map(tag => tag.tag_id));
                                                } else {
                                                    setSelected([]);
                                                }
                                            }}
                                            inputProps={{ 'aria-label': 'select all tags' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tên tag</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        textAlign: 'left',
                                        minWidth: 120,
                                        position: 'relative'
                                    }}>
                                        Hành động
                                        {selected.length > 0 && (
                                            <IconButton
                                                color="primary"
                                                onClick={() => setConfirmDeleteId(-1)}
                                                sx={{
                                                    ml: 1,
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)'
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pagedTags.map((tag, idx) => {
                                    const isItemSelected = selected.indexOf(tag.tag_id) !== -1;
                                    return (
                                        <TableRow
                                            key={tag.tag_id}
                                            hover
                                            selected={isItemSelected}
                                            sx={isItemSelected ? { backgroundColor: '#e3f2fd' } : {}}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    color="primary"
                                                    checked={isItemSelected}
                                                    onChange={() => {
                                                        const selectedIndex = selected.indexOf(tag.tag_id);
                                                        let newSelected: readonly number[] = [];
                                                        if (selectedIndex === -1) {
                                                            newSelected = [...selected, tag.tag_id];
                                                        } else {
                                                            newSelected = selected.filter(id => id !== tag.tag_id);
                                                        }
                                                        setSelected(newSelected);
                                                    }}
                                                    inputProps={{ 'aria-labelledby': `tag-checkbox-${tag.tag_id}` }}
                                                />
                                            </TableCell>
                                            <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell>{tag.tag_name}</TableCell>
                                            <TableCell>{tag.tag_description}</TableCell>
                                            <TableCell>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleShowModal(tag)}
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
                                                        disabled={deleteId === tag.tag_id}
                                                        onClick={() => setConfirmDeleteId(tag.tag_id)}
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
                                {tags.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">Không có tag nào</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 20, { label: 'Tất cả', value: -1 }]}
                            component="div"
                            count={searchTerm.trim() ? filteredTags.length : total}
                            rowsPerPage={rowsPerPage === 10000 ? -1 : rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
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
                    </TableContainer>
                </Container>
            </main>
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{editTag ? 'Chỉnh sửa Tag' : 'Thêm Tag'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên tag</Form.Label>
                            <Form.Control
                                name="tag_name"
                                value={form.tag_name}
                                onChange={handleFormChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="tag_description"
                                value={form.tag_description}
                                onChange={handleFormChange}
                                rows={3}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Hủy</Button>
                    <Button variant="primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu'}</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={!!confirmDeleteId} onHide={() => setConfirmDeleteId(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {confirmDeleteId === -1
                        ? `Bạn có chắc chắn muốn xóa ${selected.length} tag đã chọn?`
                        : `Bạn có chắc chắn muốn xóa tag ${confirmDeleteId} này?`}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>
                        Hủy
                    </Button>
                    <Button
                        variant="primary"
                        onClick={async () => {
                            if (confirmDeleteId === -1) {
                                await Promise.all(selected.map(id => handleDelete(id)));
                                setSelected([]);
                            } else if (confirmDeleteId !== null) {
                                await handleDelete(confirmDeleteId);
                            }
                            setConfirmDeleteId(null);
                        }}
                    >
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ top: { xs: 70, sm: 70 } }}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessages[0]}
                </Alert>
            </Snackbar>
        </>
    );
};

function CustomPaginationActions(props: {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
}) {
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
            {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i;
                return (
                    <Button
                        key={pageNum}
                        className={page === pageNum ? 'pagination-button-active' : 'pagination-button-outline'}
                        size="sm"
                        onClick={(event) => handlePageButtonClick(event, pageNum)}
                    >
                        {pageNum + 1}
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

export default TagsList; 