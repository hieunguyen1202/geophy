import React, { useMemo, useState } from 'react';
import { Modal, Button, Alert, Form, Table, Badge } from 'react-bootstrap';
import { FaUpload, FaDownload, FaCheck, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import userService from '../../services/userService';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

interface ExcelImportProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

interface UserData {
  email: string;
  role: number; // 1,2,3
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

const roleOptions = [
  { value: 1, label: 'Quản lý nội dung' },
  { value: 2, label: 'Giáo viên' },
  { value: 3, label: 'Học sinh' },
];

function getRoleText(role: number) {
  const roleOption = roleOptions.find(r => r.value === role);
  return roleOption ? roleOption.label : 'Không xác định';
}

/** Hỗ trợ parse cả số (1/2/3) lẫn chữ (Quản lý nội dung/Giáo viên/Học sinh) */
function toRoleCode(v: any): number | null {
  if (v === null || v === undefined) return null;

  // Nếu là số/chuỗi số 1/2/3
  const n = Number(v);
  if (!Number.isNaN(n) && [1, 2, 3].includes(n)) return n as 1 | 2 | 3;

  const s = String(v).trim().toLowerCase();
  if (['quan ly noi dung', 'quản lý nội dung', 'content manager', 'qlnd'].includes(s)) return 1;
  if (['giao vien', 'giáo viên', 'lecturer', 'teacher'].includes(s)) return 2;
  if (['hoc sinh', 'học sinh', 'student'].includes(s)) return 3;

  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const ExcelImport: React.FC<ExcelImportProps> = ({ show, onHide, onSuccess }) => {
  const [_file, setFile] = useState<File | null>(null);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<UserData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const hasRowError = useMemo(() => userData.some(u => u.status === 'error'), [userData]);
  const validPendingCount = useMemo(() => userData.filter(u => u.status === 'pending').length, [userData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setImportResults([]);
    setError(null);
    if (selectedFile) parseExcelFile(selectedFile);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!rows || rows.length < 2) {
          setUserData([]);
          setError('File Excel rỗng hoặc thiếu dữ liệu.');
          return;
        }

        // rows[0] là header: ["Email","Role"]
        const parsed: UserData[] = [];
        const seen = new Set<string>(); // check trùng email trong file
        const invalids: Array<{ row: number; message: string }> = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] || [];
          const emailCell = row[0];
          const roleCell = row[1];

          const email = String(emailCell ?? '').trim();
          const roleCode = toRoleCode(roleCell);

          // Validate
          if (!email || !EMAIL_RE.test(email)) {
            parsed.push({ email: email || '(trống)', role: 0 as any, status: 'error', error: 'Email không hợp lệ' });
            invalids.push({ row: i + 1, message: 'Email không hợp lệ' });
            continue;
          }

          const emailKey = email.toLowerCase();
          if (seen.has(emailKey)) {
            parsed.push({ email, role: 0 as any, status: 'error', error: 'Trùng email trong file' });
            invalids.push({ row: i + 1, message: 'Trùng email trong file' });
            continue;
          }

          if (roleCode === null) {
            parsed.push({ email, role: 0 as any, status: 'error', error: 'Role không hợp lệ (chỉ 1/2/3 hoặc tên role)' });
            invalids.push({ row: i + 1, message: 'Role không hợp lệ' });
            continue;
          }

          parsed.push({ email, role: roleCode, status: 'pending' });
          seen.add(emailKey);
        }

        setUserData(parsed);

        // Snackbar thông báo số dòng hợp lệ/lỗi
        const ok = parsed.filter(x => x.status === 'pending').length;
        const bad = parsed.filter(x => x.status === 'error').length;
        setSnackMsg(`Đọc file xong: ${ok} hợp lệ, ${bad} lỗi`);
        setSnackSeverity(bad ? 'warning' : 'success');
        setSnackOpen(true);
      } catch (err) {
        setUserData([]);
        setError('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
        setSnackMsg('Không đọc được file Excel');
        setSnackSeverity('error');
        setSnackOpen(true);
        console.error('Error parsing Excel file:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Email', 'Role'],
      ['alice@example.com', 'Học sinh'],       // chấp nhận tên role
      ['bob@example.com', '2'],                // hoặc mã role 1/2/3
      ['manager@example.com', 'Quản lý nội dung'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'user_import_template.xlsx');
  };

  const handleImport = async () => {
    if (userData.length === 0) return;

    const list = userData.filter(u => u.status === 'pending'); // chỉ import dòng hợp lệ
    if (list.length === 0) {
      setSnackMsg('Không có dòng hợp lệ để import.');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    setImporting(true);
    const results: UserData[] = [];

    for (const user of list) {
      try {
        await userService.addUser({ email: user.email, role: user.role });
        results.push({ ...user, status: 'success' });
      } catch (err: any) {
        results.push({
          ...user,
          status: 'error',
          error: err?.response?.data?.message || err?.message || 'Lỗi không xác định',
        });
      }
    }

    // Giữ lại cả các dòng sai từ trước (status=error) để hiển thị đầy đủ
    const combined = [
      ...userData.filter(u => u.status === 'error'),
      ...results,
    ];
    setImportResults(combined);

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'error').length;

    setSnackMsg(`Import xong: ${successCount} thành công, ${failCount} lỗi`);
    setSnackSeverity(failCount ? 'warning' : 'success');
    setSnackOpen(true);

    setImporting(false);

    if (successCount > 0) onSuccess();
  };

  const handleClose = () => {
    setFile(null);
    setUserData([]);
    setImportResults([]);
    setError(null);
    setSnackOpen(false);
    onHide();
  };

  const renderPreviewTable = () => {
    const data = importResults.length > 0 ? importResults : userData;
    return (
      <Table responsive size="sm" className="mt-3">
        <thead>
          <tr>
            <th>Email</th>
            <th>Chức vụ</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <tr key={`${user.email}-${index}`}>
              <td>{user.email}</td>
              <td>{getRoleText(user.role)}</td>
              <td>
                {user.status === 'pending' && <Badge bg="secondary">Chờ xử lý</Badge>}
                {user.status === 'success' && <Badge bg="success"><FaCheck /> Thành công</Badge>}
                {user.status === 'error' && (
                  <div>
                    <Badge bg="danger"><FaTimes /> Lỗi</Badge>
                    {user.error && <div className="text-danger small mt-1">{user.error}</div>}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Import người dùng từ Excel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6>Chọn file Excel</h6>
              <Button variant="outline-info" size="sm" onClick={downloadTemplate}>
                <FaDownload className="me-2" />
                Tải template
              </Button>
            </div>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
            <Form.Text className="text-muted">
              File phải có 2 cột: <b>Email</b> và <b>Role</b> (nhập <code>1/2/3</code> hoặc tên role: “Quản lý nội dung/Giáo viên/Học sinh”).
            </Form.Text>
          </div>

          {userData.length > 0 && (
            <div>
              <h6>Xem trước dữ liệu ({userData.length} dòng)</h6>
              {renderPreviewTable()}
            </div>
          )}

          {importResults.length > 0 && (
            <div className="mt-3">
              <Alert variant="info">
                Kết quả import: {importResults.filter(r => r.status === 'success').length} thành công,{' '}
                {importResults.filter(r => r.status === 'error').length} lỗi
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={importing}>
            Đóng
          </Button>

          {/* Import chỉ khi: có dữ liệu, chưa có kết quả import, không có lỗi trong preview */}
          {userData.length > 0 && importResults.length === 0 && (
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={importing || hasRowError || validPendingCount === 0}
            >
              <FaUpload className="me-2" />
              {importing ? 'Đang import...' : `Import ${validPendingCount} người dùng`}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={() => setSnackOpen(false)} severity={snackSeverity} variant="filled" sx={{ width: '100%' }}>
          {snackMsg}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default ExcelImport;
