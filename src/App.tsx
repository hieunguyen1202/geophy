import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import QuestionsList from './pages/content-manager/QuestionsList';
import Login from './pages/Login';
import Register from './pages/Register';
import { listMenuUser } from './config';
import './App.css';
import AddQuestion from './pages/content-manager/AddQuestion';
import ChaptersList from './pages/content-manager/ChaptersList';
import TagsList from './pages/content-manager/TagsList';
import Profile from './pages/profile-management/Profile'
import Test from './pages/lecturer/Test'
import AddTest from './pages/lecturer/AddTest';
import LessonsList from './pages/content-manager/LessonsList';
import ResourceSubject from './pages/resource/ResourceSubject';
import ChapterLessons from './pages/resource/ChapterLessons';
import ResourcePage from './pages/resource/ResourcePage';
import ForgotPassword from './pages/auth/ForgotPassword';
import UnitySimulations from './pages/UnitySimulations';
import StudentTestList from './pages/student/StudentTestList';
import StudentTestDetail from './pages/student/StudentTestDetail';
import UpdateTest from './pages/lecturer/UpdateTest';
import ClassList from "./pages/ClassList";
import JoinClassPage from "./pages/JoinClassPage";
import TestSendDataToUnity from "./pages/TestSendDataToUnity";
import StudentClassesPage from './pages/student/StudentClassesPage';
import StudentTestHistory from './pages/student/StudentTestHistory';
import { AdminUserManagementPage } from './pages/admin';
import { AdminDashboardPage } from './pages/admin';
import StudentClassDetail from "./pages/student/StudentClassDetail";
import AddLesson from './pages/content-manager/AddLesson';
import { withRoleCheck } from './components/hoc/withRoleCheck';
import React from 'react';
import RoleRedirectTest from './components/RoleRedirectTest';
import Dashboard  from './pages/content-manager/Dashboard';


function App() {
  return (
    // <div className="min-h-screen bg-white text-black">
    <Routes>
      <Route path="/" element={<LandingPage listMenuUser={listMenuUser} />} />
      <Route path="/content-manager/question" element={
        React.createElement(withRoleCheck(QuestionsList, { allowedRoles: ['content manager'] }))
      } />
      <Route path="/content-manager/question/add-question" element={
        React.createElement(withRoleCheck(AddQuestion, { allowedRoles: ['content manager'] }))
      } />
      <Route path="/content-manager/lesson" element={
        React.createElement(withRoleCheck(LessonsList, { allowedRoles: ['content manager'] }))
      } />
      <Route path="/content-manager/lesson/add" element={
        React.createElement(withRoleCheck(AddLesson, { allowedRoles: ['content manager'] }))
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/content-manager/chapter" element={
        React.createElement(withRoleCheck(ChaptersList, { allowedRoles: ['content manager'] }))
      } />
      <Route path="/content-manager/tag" element={
        React.createElement(withRoleCheck(TagsList, { allowedRoles: ['content manager'] }))
      } />
      <Route path="/content-manager/dashboard" element={
        React.createElement(withRoleCheck(Dashboard, { allowedRoles: ['content manager'] }))
      } />
      <Route path='/profile' element={<Profile listMenuUser={listMenuUser} />} />
      <Route path='/lecturer/test' element={
        React.createElement(withRoleCheck(Test, { allowedRoles: ['lecturer'] }))
      } />
      <Route path='/lecturer/add-test' element={
        React.createElement(withRoleCheck(AddTest, { allowedRoles: ['lecturer'] }))
      } />
      <Route path="/lessons/chapter/:chapterId" element={<ChapterLessons />} />
      <Route path="/resource" element={<ResourcePage />} />
      <Route path="/resource/math" element={<ResourceSubject subject={0} />} />
      <Route path="/resource/physics" element={<ResourceSubject subject={1} />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/unity-simulations' element={<UnitySimulations listMenuUser={listMenuUser} />} />
      <Route path='/student-test-list' element={
        React.createElement(withRoleCheck(StudentTestList, { allowedRoles: ['student'] }), { listMenuUser })
      } />
      <Route path='/student-test-detail/:testId' element={
        React.createElement(withRoleCheck(StudentTestDetail, { allowedRoles: ['student'] }), { listMenuUser })
      } />
      <Route
        path="/lecturer/update-test/:testId"
        element={React.createElement(
          withRoleCheck(UpdateTest, { allowedRoles: ["lecturer"] })
        )}
      />
      <Route path='/student/classes' element={
        React.createElement(withRoleCheck(StudentClassesPage, { allowedRoles: ['student'] }), { listMenuUser })
      } />
      <Route path='/student-test-history' element={
        React.createElement(withRoleCheck(StudentTestHistory, { allowedRoles: ['student'] }), { listMenuUser })
      } />
      <Route path="/student/classes/:id" element={
        React.createElement(withRoleCheck(StudentClassDetail, { allowedRoles: ['student'] }), { listMenuUser })
      } />
      <Route path="/lecturer/classes/:id" element={<StudentClassDetail listMenuUser={listMenuUser} />} />

      {/* Route cho content-manager */}
      <Route path="/content-manager/classes" element={
        React.createElement(withRoleCheck(ClassList, { allowedRoles: ['content manager'] }))
      } />
      <Route path="/content-manager/profile" element={
        React.createElement(withRoleCheck(Profile, { allowedRoles: ['content manager'] }))
      } />
      {/* Route cho lecturer */}
      <Route path="/lecturer/classes" element={
        React.createElement(withRoleCheck(ClassList, { allowedRoles: ['lecturer'] }))
      } />
      <Route path="/lecturer/profile" element={
        React.createElement(withRoleCheck(Profile, { allowedRoles: ['lecturer'] }))
      } />
      <Route path="/join" element={<JoinClassPage />} />
      <Route path="/test-unity" element={<TestSendDataToUnity />} />
      <Route path="*" element={<div>Page Not Found</div>} />

      {/* admin */}
      <Route path="/admin/users" element={
        React.createElement(withRoleCheck(AdminUserManagementPage, { allowedRoles: ['admin'] }))
      } />
      <Route path="/admin/dashboard" element={
        React.createElement(withRoleCheck(AdminDashboardPage, { allowedRoles: ['admin'] }))
      } />
      <Route path="/admin/profile" element={
        React.createElement(withRoleCheck(Profile, { allowedRoles: ['admin'] }))
      } />

      {/* Test route for role-based redirection */}
      <Route path="/test-role-redirect" element={<RoleRedirectTest />} />

    </Routes>
    // </div>
  );
}

export default App;
