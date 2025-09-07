import React from 'react';

interface Choice {
  id: number;
  content: string;
  is_correct: boolean;
  question_id: number;
}

interface Question {
  id: number;
  question_content: string;
  difficulty: number;
  question_type: number;
  simulation_data: string;
  point: number;
  choices?: Choice[];
  student_answer: string | null;
  selected_choice_ids: number[] | null;
}

interface QuestionsTableProps {
  questions: Question[];
}

const QuestionsTable: React.FC<QuestionsTableProps> = ({ questions }) => {
  const getDifficultyText = (difficulty: number): string => {
    switch (difficulty) {
      case 0: return 'Dễ';
      case 1: return 'Trung bình';
      case 2: return 'Khó';
      default: return 'Không xác định';
    }
  };

  const getQuestionTypeText = (type: number): string => {
    switch (type) {
      case 0: return 'Trắc nghiệm';
      case 1: return 'Tự luận';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Câu hỏi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Loại
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Độ khó
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Điểm
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Đáp án đúng
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((question, index) => (
            <tr key={question.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {index + 1}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                <div className="truncate" title={question.question_content}>
                  {question.question_content}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getQuestionTypeText(question.question_type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getDifficultyText(question.difficulty)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.point} điểm
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div className="space-y-1">
                  {question.choices?.filter((choice: Choice) => choice.is_correct).map((choice: Choice) => (
                    <span key={choice.id} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {choice.content}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionsTable;
