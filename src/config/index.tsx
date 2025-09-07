import { FaChartArea, FaCogs, FaFolder, FaHome, FaMusic, FaRegImage, FaUser, FaUsers } from "react-icons/fa";
import { CiGrid41, CiUser, CiWavePulse1 } from "react-icons/ci";
import type { BaseListMenu } from "../types";
import { FaChalkboardTeacher, FaFileAlt } from "react-icons/fa";


const listSubMenuUser: BaseListMenu[] = [
    { name: "Danh sách thiệp", icon: CiGrid41, path: "/user/wedding-card" },
    { name: "Tổng quan", icon: CiWavePulse1, path: "/user/wedding-card/detail/1" },
    { name: "Trang cá nhân", icon: CiUser, path: "/user/account" }
]

const listMenuUser: BaseListMenu[] = [
    { name: "Mô phỏng", path: "/unity-simulations" },
    { name: "Luyện tập", path: "/student-test-list" },
    { name: "Tài nguyên", path: "/resource" },
    // { name: "Tin tức", path: "#"} 
]

const listMenuContentManager: BaseListMenu[] = [
    { name: "Tổng quan", path: "/content-manager/dashboard" },
    { name: "Câu hỏi", path: "/content-manager/question" },
    { name: "Lớp học", path: "/content-manager/classes" },
    { name: "Chương", path: "/content-manager/chapter" },
    { name: "Bài học", path: "/content-manager/lesson" },
    // { name: "Tag", path: "/content-manager/tag" },
    // { name: "Tin tức", path: "#"} 
]
const listMenuLecturer: BaseListMenu[] = [
    { name: "Luyện tập", path: "/lecturer/test",  icon: FaFileAlt, },
    { name: "Lớp học", path: "/lecturer/classes", icon: FaChalkboardTeacher, },
    // { name: "Tin tức", path: "#"} 
]
const listMenuAdmin: BaseListMenu[] = [
    { name: "Thống kê", path: "/admin/dashboard", icon: FaChartArea, },
    { name: "Quản lý người dùng", path: "/admin/users",   icon: FaUser },
    // { name: "Tin tức", path: "#"} 
]
export {
    listMenuAdmin,
    listMenuUser,
    listSubMenuUser,
    listMenuContentManager,
    listMenuLecturer
};
